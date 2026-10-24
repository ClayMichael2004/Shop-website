package models

import (
	"testing"
	"time"
)

func TestMaskName(t *testing.T) {
	cases := []struct {
		input    string
		expected string
	}{
		{"John Doe", "J*** D***"},
		{"Alice", "A***"},
		{"Bob Smith Johnson", "B*** S*** J***"},
		{"", "Customer"},
	}

	for _, c := range cases {
		out := MaskName(c.input)
		if out != c.expected {
			t.Errorf("MaskName(%q) = %q; expected %q", c.input, out, c.expected)
		}
	}
}

func TestPublicQuoteResponse_Redaction(t *testing.T) {
	now := time.Now()
	fullQuote := &QuoteRequest{
		ID:               101,
		QuoteNumber:      "EQ-2026-ABCD-1234",
		CustomerName:     "Robert Davis",
		CustomerEmail:    "robert@confidential-corp.com",
		CustomerPhone:    "+254700000000",
		CustomerLocation: "Building 4, Private Road",
		Notes:            "Do not disclose this quote to competitors",
		AdminNotes:       "High margin customer, 35% margin approved",
		Status:           "quoted",
		Subtotal:         1200.0,
		GrandTotal:       1200.0,
		CreatedAt:        now,
	}

	pub := fullQuote.ToPublicResponse()
	if pub.CustomerMaskedName != "R*** D***" {
		t.Errorf("expected masked customer name R*** D***, got %s", pub.CustomerMaskedName)
	}
	if pub.QuoteNumber != "EQ-2026-ABCD-1234" {
		t.Errorf("expected quote number to match, got %s", pub.QuoteNumber)
	}
}
