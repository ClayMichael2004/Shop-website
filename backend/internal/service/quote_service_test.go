package service

import (
	"os"
	"testing"

	"electrical-shop-backend/internal/cache"
	"electrical-shop-backend/internal/config"
	"electrical-shop-backend/internal/database"
	"electrical-shop-backend/internal/models"
)

func setupTestDB(t *testing.T) (*database.DB, func()) {
	testDBPath := "./test_shop.db"
	_ = os.Remove(testDBPath)

	db, err := database.InitDB(testDBPath)
	if err != nil {
		t.Fatalf("failed to init test db: %v", err)
	}

	teardown := func() {
		db.Close()
		_ = os.Remove(testDBPath)
	}
	return db, teardown
}

func TestProductService_ListAndFilter(t *testing.T) {
	db, teardown := setupTestDB(t)
	defer teardown()

	memCache := cache.NewMemoryCache()
	prodSvc := NewProductService(db, memCache)

	// List all products
	res, err := prodSvc.ListProducts("", "", 1, 10, "")
	if err != nil {
		t.Fatalf("failed to list products: %v", err)
	}
	if res.Total < 4 {
		t.Fatalf("expected seeded products, got total %d", res.Total)
	}

	// Filter by category
	armouredRes, err := prodSvc.ListProducts("Armoured Cables", "", 1, 10, "")
	if err != nil {
		t.Fatalf("failed to filter by category: %v", err)
	}
	if len(armouredRes.Products) == 0 {
		t.Fatalf("expected armoured cables, got 0")
	}
}

func TestQuoteService_CreateAndTrack(t *testing.T) {
	db, teardown := setupTestDB(t)
	defer teardown()

	cfg := config.Load()
	memCache := cache.NewMemoryCache()
	prodSvc := NewProductService(db, memCache)
	emailSvc := NewEmailService(cfg)
	whatsAppSvc := NewWhatsAppService(cfg)
	quoteSvc := NewQuoteService(db, emailSvc, whatsAppSvc, prodSvc)

	input := &models.CreateQuoteInput{
		CustomerName:     "Alice Builder",
		CustomerPhone:    "+254711223344",
		CustomerEmail:    "alice@example.com",
		CustomerLocation: "Westlands, Nairobi",
		Notes:            "Need quotation for 3-phase commercial project",
		ClientUUID:       "offline-test-uuid-12345",
		Items: []models.CreateItemInput{
			{ProductID: 1, Quantity: 3, SpecsNotes: "50m drum cut"},
			{ProductID: 2, Quantity: 10, SpecsNotes: "Red and Blue"},
		},
	}

	res, err := quoteSvc.CreateQuote(input)
	if err != nil {
		t.Fatalf("failed to create quote: %v", err)
	}
	if res.QuoteNumber == "" {
		t.Fatalf("expected generated quote number, got empty")
	}
	if res.WhatsAppLink == "" {
		t.Fatalf("expected WhatsApp deep link, got empty")
	}

	// Track quote by number
	tracked, err := quoteSvc.GetQuoteByNumber(res.QuoteNumber)
	if err != nil {
		t.Fatalf("failed to track quote: %v", err)
	}
	if tracked == nil || tracked.CustomerName != "Alice Builder" {
		t.Fatalf("tracked quote data mismatch: %+v", tracked)
	}
	if len(tracked.Items) != 2 {
		t.Fatalf("expected 2 items, got %d", len(tracked.Items))
	}

	// Test idempotency: submitting same client_uuid should return existing quote without error
	duplicateRes, err := quoteSvc.CreateQuote(input)
	if err != nil {
		t.Fatalf("idempotent quote creation failed: %v", err)
	}
	if duplicateRes.QuoteNumber != res.QuoteNumber {
		t.Fatalf("expected same quote number for duplicate sync, got %s vs %s", duplicateRes.QuoteNumber, res.QuoteNumber)
	}
}
