package service

import (
	"fmt"
	"net/url"
	"strings"

	"electrical-shop-backend/internal/config"
	"electrical-shop-backend/internal/models"
)

type WhatsAppService struct {
	cfg *config.Config
}

func NewWhatsAppService(cfg *config.Config) *WhatsAppService {
	return &WhatsAppService{cfg: cfg}
}

// BuildCustomerQuoteMessage generates the WhatsApp message string and link for the customer to send to the shop.
func (w *WhatsAppService) BuildCustomerQuoteMessage(quote *models.QuoteRequest) (string, string) {
	var sb strings.Builder
	sb.WriteString("*KADIANGA ELECTRICALS - QUOTATION REQUEST*\n\n")
	sb.WriteString(fmt.Sprintf("*Quote Ref:* #%s\n", quote.QuoteNumber))
	sb.WriteString(fmt.Sprintf("*Client Name:* %s\n", quote.CustomerName))
	sb.WriteString(fmt.Sprintf("*Contact Phone:* %s\n", quote.CustomerPhone))
	if quote.CustomerEmail != "" {
		sb.WriteString(fmt.Sprintf("*Email:* %s\n", quote.CustomerEmail))
	}
	if quote.CustomerLocation != "" {
		sb.WriteString(fmt.Sprintf("*Delivery / Site Location:* %s\n", quote.CustomerLocation))
	}
	sb.WriteString("\n*Requested Items:*\n")

	for i, item := range quote.Items {
		note := ""
		if item.SpecsNotes != "" {
			note = fmt.Sprintf(" (%s)", item.SpecsNotes)
		}
		sb.WriteString(fmt.Sprintf("%d. *%s* × %d%s\n", i+1, item.ProductName, item.Quantity, note))
	}

	if quote.Notes != "" {
		sb.WriteString(fmt.Sprintf("\n*Notes:* %s\n", quote.Notes))
	}

	sb.WriteString("\n_Sent via Kadianga Electricals Catalog. Please provide official contractor prices._")

	rawMsg := sb.String()
	cleanPhone := cleanPhoneNumber(w.cfg.ShopWhatsApp)
	link := fmt.Sprintf("https://wa.me/%s?text=%s", cleanPhone, url.QueryEscape(rawMsg))

	return rawMsg, link
}

// BuildShopOwnerReplyMessage generates the WhatsApp message and link for the shop owner to reply directly to the customer.
func (w *WhatsAppService) BuildShopOwnerReplyMessage(quote *models.QuoteRequest) (string, string) {
	var sb strings.Builder
	sb.WriteString("*KADIANGA ELECTRICALS - OFFICIAL QUOTE*\n\n")
	sb.WriteString(fmt.Sprintf("Dear *%s*,\nHere is your requested quotation *#%s*:\n\n", quote.CustomerName, quote.QuoteNumber))

	sb.WriteString("*Item Breakdown:*\n")
	for i, item := range quote.Items {
		sb.WriteString(fmt.Sprintf("%d. *%s*\n   Qty: %d @ $%.2f = *$%.2f*\n",
			i+1, item.ProductName, item.Quantity, item.QuotedUnit, item.QuotedTotal))
	}

	sb.WriteString("\n----------------------------\n")
	sb.WriteString(fmt.Sprintf("Subtotal: $%.2f\n", quote.Subtotal))
	if quote.Discount > 0 {
		sb.WriteString(fmt.Sprintf("Discount: -$%.2f\n", quote.Discount))
	}
	if quote.DeliveryFee > 0 {
		sb.WriteString(fmt.Sprintf("Delivery: $%.2f\n", quote.DeliveryFee))
	}
	sb.WriteString(fmt.Sprintf("*GRAND TOTAL: $%.2f*\n", quote.GrandTotal))
	sb.WriteString("----------------------------\n")

	if quote.AdminNotes != "" {
		sb.WriteString(fmt.Sprintf("\n*Shop Notes / Terms:* %s\n", quote.AdminNotes))
	}

	sb.WriteString("\n_Prices are valid for 14 days. Reply here to confirm and arrange dispatch._")

	rawMsg := sb.String()
	cleanPhone := cleanPhoneNumber(quote.CustomerPhone)
	link := fmt.Sprintf("https://wa.me/%s?text=%s", cleanPhone, url.QueryEscape(rawMsg))

	return rawMsg, link
}

func cleanPhoneNumber(phone string) string {
	var b strings.Builder
	for _, r := range phone {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	res := b.String()
	// Normalize local phone numbers (e.g. 0712345678 -> 254712345678) for valid WhatsApp wa.me deep links
	if strings.HasPrefix(res, "0") && len(res) == 10 {
		res = "254" + res[1:]
	}
	return res
}
