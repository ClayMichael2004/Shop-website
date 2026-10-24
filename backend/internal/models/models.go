package models

import (
	"strings"
	"time"
)

// Product represents an electrical product in the catalog.
type Product struct {
	ID                int64     `json:"id"`
	SKU               string    `json:"sku"`
	Name              string    `json:"name"`
	Slug              string    `json:"slug"`
	Category          string    `json:"category"`          // e.g. "Armoured Cables", "Single Core Cables", "Twin & Earth Cables", "Chandeliers & Lighting", "Switchgear & Meters", "Accessories"
	Subcategory       string    `json:"subcategory"`       // e.g. "4-Core XLPE", "Conduit Wire", "Pendant Lamps", "MCB"
	ShortDesc         string    `json:"short_description"`
	FullDesc          string    `json:"full_description"`
	ImageURL          string    `json:"image_url"`
	GalleryImages     []string  `json:"gallery_images,omitempty"`
	Specs             string    `json:"specs"`             // JSON string or formatted specs
	InStock           bool      `json:"in_stock"`
	BaseEstimatePrice float64   `json:"base_estimate_price"` // Reference guide price or 0 for quote only
	Rating            float64   `json:"rating"`
	ReviewsCount      int       `json:"reviews_count"`
	Featured          bool      `json:"featured"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// QuoteItem represents an item within a requested quotation.
type QuoteItem struct {
	ID           int64   `json:"id"`
	QuoteID      int64   `json:"quote_id"`
	ProductID    int64   `json:"product_id"`
	ProductName  string  `json:"product_name"`
	ProductSKU   string  `json:"product_sku"`
	ProductImage string  `json:"product_image"`
	Quantity     int     `json:"quantity"`
	QuotedUnit   float64 `json:"quoted_unit_price"`
	QuotedTotal  float64 `json:"quoted_total_price"`
	SpecsNotes   string  `json:"specs_notes,omitempty"`
}

// QuoteRequest represents a customer quotation submission.
type QuoteRequest struct {
	ID               int64       `json:"id"`
	QuoteNumber      string      `json:"quote_number"` // e.g. EQ-2026-8492
	CustomerName     string      `json:"customer_name"`
	CustomerEmail    string      `json:"customer_email"`
	CustomerPhone    string      `json:"customer_phone"`
	CustomerLocation string      `json:"customer_location"`
	Notes            string      `json:"notes"`
	PreferredContact string      `json:"preferred_contact"` // "whatsapp", "email", "both"
	Status           string      `json:"status"`            // "pending", "reviewing", "quoted", "accepted", "closed"
	Subtotal         float64     `json:"subtotal"`
	Discount         float64     `json:"discount"`
	DeliveryFee      float64     `json:"delivery_fee"`
	GrandTotal       float64     `json:"grand_total"`
	AdminNotes       string      `json:"admin_notes"`
	ClientUUID       string      `json:"client_uuid,omitempty"` // For offline first tracking
	WhatsAppSent     bool        `json:"whatsapp_sent"`
	EmailSent        bool        `json:"email_sent"`
	QuotedAt         *time.Time  `json:"quoted_at,omitempty"`
	CreatedAt        time.Time   `json:"created_at"`
	UpdatedAt        time.Time   `json:"updated_at"`
	Items            []QuoteItem `json:"items,omitempty"`
}

// CreateQuoteInput is the payload sent from frontend/client when submitting a quote.
type CreateQuoteInput struct {
	CustomerName     string           `json:"customer_name"`
	CustomerEmail    string           `json:"customer_email"`
	CustomerPhone    string           `json:"customer_phone"`
	CustomerLocation string           `json:"customer_location"`
	Notes            string           `json:"notes"`
	PreferredContact string           `json:"preferred_contact"`
	ClientUUID       string           `json:"client_uuid"`
	Items            []CreateItemInput `json:"items"`
}

// CreateItemInput is an item in the quote submission payload.
type CreateItemInput struct {
	ProductID  int64  `json:"product_id"`
	Quantity   int    `json:"quantity"`
	SpecsNotes string `json:"specs_notes"`
}

// QuoteSyncPayload handles batch sync for offline requests.
type QuoteSyncPayload struct {
	Quotes []CreateQuoteInput `json:"quotes"`
}

// AdminStats provides an overview dashboard count.
type AdminStats struct {
	TotalQuotes   int     `json:"total_quotes"`
	PendingQuotes int     `json:"pending_quotes"`
	QuotedQuotes  int     `json:"quoted_quotes"`
	TotalProducts int     `json:"total_products"`
	TotalQuotedVal float64 `json:"total_quoted_value"`
}

// PublicQuoteResponse is a sanitized representation of a quotation for public tracking,
// eliminating sensitive PII (raw phone, email, physical delivery address, admin margin notes).
type PublicQuoteResponse struct {
	QuoteNumber        string      `json:"quote_number"`
	CustomerMaskedName string      `json:"customer_masked_name"`
	Status             string      `json:"status"`
	Subtotal           float64     `json:"subtotal"`
	Discount           float64     `json:"discount"`
	DeliveryFee        float64     `json:"delivery_fee"`
	GrandTotal         float64     `json:"grand_total"`
	QuotedAt           *time.Time  `json:"quoted_at,omitempty"`
	CreatedAt          time.Time   `json:"created_at"`
	Items              []QuoteItem `json:"items,omitempty"`
}

// ToPublicResponse converts an internal QuoteRequest to a privacy-preserving PublicQuoteResponse.
func (q *QuoteRequest) ToPublicResponse() *PublicQuoteResponse {
	if q == nil {
		return nil
	}
	return &PublicQuoteResponse{
		QuoteNumber:        q.QuoteNumber,
		CustomerMaskedName: MaskName(q.CustomerName),
		Status:             q.Status,
		Subtotal:           q.Subtotal,
		Discount:           q.Discount,
		DeliveryFee:        q.DeliveryFee,
		GrandTotal:         q.GrandTotal,
		QuotedAt:           q.QuotedAt,
		CreatedAt:          q.CreatedAt,
		Items:              q.Items,
	}
}

// MaskName masks customer name for PII privacy protection (e.g. "John Doe" -> "J*** D***").
func MaskName(name string) string {
	parts := strings.Fields(name)
	if len(parts) == 0 {
		return "Customer"
	}
	var masked []string
	for _, p := range parts {
		runes := []rune(p)
		if len(runes) <= 1 {
			masked = append(masked, string(runes))
		} else {
			masked = append(masked, string(runes[0])+"***")
		}
	}
	return strings.Join(masked, " ")
}
