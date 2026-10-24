package service

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"net/smtp"
	"strings"

	"electrical-shop-backend/internal/config"
	"electrical-shop-backend/internal/models"
)

type EmailService struct {
	cfg *config.Config
}

func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{cfg: cfg}
}

// SendQuoteReceiptConfirmation sends an instant confirmation to the customer upon quote submission.
func (e *EmailService) SendQuoteReceiptConfirmation(quote *models.QuoteRequest) error {
	subject := fmt.Sprintf("Quotation Received [%s] - %s", quote.QuoteNumber, e.cfg.ShopName)

	tmpl := `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 20px; color: #1f2937; }
  .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
  .header { background: #121212; color: #ffffff; padding: 32px 24px; text-align: center; }
  .header h1 { margin: 0 0 8px 0; font-size: 24px; letter-spacing: -0.5px; }
  .header p { margin: 0; color: #9ca3af; font-size: 14px; }
  .badge { display: inline-block; background: #22c55e; color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-top: 12px; }
  .content { padding: 32px 24px; }
  .greeting { font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
  .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .info-box p { margin: 4px 0; font-size: 14px; }
  .items-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  .items-table th { text-align: left; background: #f3f4f6; padding: 10px; font-size: 12px; text-transform: uppercase; color: #4b5563; }
  .items-table td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
  .footer { background: #f9fafb; padding: 20px 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  .contact-btn { display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-top: 16px; }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>{{.ShopName}}</h1>
      <p>Official Electrical Hardware & Engineering Supplies</p>
      <div class="badge">Quotation In Progress</div>
    </div>
    <div class="content">
      <div class="greeting">
        Hello <strong>{{.Quote.CustomerName}}</strong>,<br><br>
        Thank you for reaching out to <strong>{{.ShopName}}</strong>. We have successfully received your quotation request <strong>#{{.Quote.QuoteNumber}}</strong>.
        Our electrical sales team is reviewing your item specifications and calculating current bulk pricing and availability.
      </div>

      <div class="info-box">
        <p><strong>Quote Reference:</strong> {{.Quote.QuoteNumber}}</p>
        <p><strong>Date Submitted:</strong> {{.Quote.CreatedAt.Format "02 Jan 2006 15:04 MST"}}</p>
        <p><strong>Customer Email:</strong> {{.Quote.CustomerEmail}}</p>
        <p><strong>Customer Phone:</strong> {{.Quote.CustomerPhone}}</p>
        {{if .Quote.CustomerLocation}}<p><strong>Delivery Location:</strong> {{.Quote.CustomerLocation}}</p>{{end}}
        {{if .Quote.Notes}}<p><strong>Project Notes:</strong> {{.Quote.Notes}}</p>{{end}}
      </div>

      <h3>Requested Items</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Item Description</th>
            <th style="text-align:center;">Qty</th>
            <th>Specs Note</th>
          </tr>
        </thead>
        <tbody>
          {{range .Quote.Items}}
          <tr>
            <td><strong>{{.ProductName}}</strong><br><small style="color:#6b7280;">SKU: {{.ProductSKU}}</small></td>
            <td style="text-align:center;">{{.Quantity}}</td>
            <td>{{if .SpecsNotes}}{{.SpecsNotes}}{{else}}-{{end}}</td>
          </tr>
          {{end}}
        </tbody>
      </table>

      <p style="margin-top: 24px; font-size: 14px; color: #4b5563;">
        Once the quote is finalized by the shop owner, you will receive an itemized quote document right here in your inbox.
        Need urgent delivery or immediate assistance? You can also message our dispatch line directly:
      </p>

      <center>
        <a href="https://wa.me/{{.ShopWhatsApp}}?text=Hello%20Kadianga%20Electricals,%20following%20up%20on%20my%20Quotation%20{{.Quote.QuoteNumber}}" class="contact-btn">
          Follow up via WhatsApp
        </a>
      </center>
    </div>
    <div class="footer">
      {{.ShopName}} • {{.ShopAddress}}<br>
      Automated Quotation System • No login required.
    </div>
  </div>
</body>
</html>
`

	body, err := e.renderTemplate(tmpl, map[string]interface{}{
		"ShopName":     e.cfg.ShopName,
		"ShopWhatsApp": e.cfg.ShopWhatsApp,
		"ShopAddress":  e.cfg.ShopAddress,
		"Quote":        quote,
	})
	if err != nil {
		return err
	}

	return e.sendMail(quote.CustomerEmail, subject, body)
}

// SendFinalizedQuoteToCustomer sends the priced quotation when the shop owner finishes calculations.
func (e *EmailService) SendFinalizedQuoteToCustomer(quote *models.QuoteRequest) error {
	subject := fmt.Sprintf("Official Quotation [%s] from %s", quote.QuoteNumber, e.cfg.ShopName)

	tmpl := `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 20px; color: #1f2937; }
  .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
  .header { background: #121212; color: #ffffff; padding: 32px 24px; text-align: center; }
  .header h1 { margin: 0 0 8px 0; font-size: 24px; letter-spacing: -0.5px; }
  .badge { display: inline-block; background: #3b82f6; color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-top: 10px; }
  .content { padding: 32px 24px; }
  .greeting { font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
  .items-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  .items-table th { text-align: left; background: #f3f4f6; padding: 10px; font-size: 12px; text-transform: uppercase; color: #4b5563; }
  .items-table td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
  .totals-table { width: 100%; margin-top: 20px; border-top: 2px solid #1f2937; }
  .totals-table td { padding: 8px 10px; font-size: 14px; }
  .totals-table .grand { font-size: 18px; font-weight: 700; color: #111827; }
  .notes-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 14px; color: #713f12; }
  .footer { background: #f9fafb; padding: 20px 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  .cta-container { text-align: center; margin-top: 30px; }
  .accept-btn { display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>{{.ShopName}}</h1>
      <p>Quotation Estimate</p>
      <div class="badge">Quote Finalized: {{.Quote.QuoteNumber}}</div>
    </div>
    <div class="content">
      <div class="greeting">
        Dear <strong>{{.Quote.CustomerName}}</strong>,<br><br>
        We have finished compiling your requested quotation. Please find the itemized price breakdown below:
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Unit Price</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          {{range .Quote.Items}}
          <tr>
            <td>
              <strong>{{.ProductName}}</strong><br>
              <small style="color:#6b7280;">{{.ProductSKU}}</small>
            </td>
            <td style="text-align:center;">{{.Quantity}}</td>
            <td style="text-align:right;">${{printf "%.2f" .QuotedUnit}}</td>
            <td style="text-align:right; font-weight:600;">${{printf "%.2f" .QuotedTotal}}</td>
          </tr>
          {{end}}
        </tbody>
      </table>

      <table class="totals-table">
        <tr>
          <td colspan="3" style="text-align:right;">Subtotal:</td>
          <td style="text-align:right; font-weight:600;">${{printf "%.2f" .Quote.Subtotal}}</td>
        </tr>
        {{if gt .Quote.Discount 0.0}}
        <tr>
          <td colspan="3" style="text-align:right; color:#16a34a;">Discount:</td>
          <td style="text-align:right; color:#16a34a;">-${{printf "%.2f" .Quote.Discount}}</td>
        </tr>
        {{end}}
        {{if gt .Quote.DeliveryFee 0.0}}
        <tr>
          <td colspan="3" style="text-align:right;">Estimated Delivery / Transit:</td>
          <td style="text-align:right;">${{printf "%.2f" .Quote.DeliveryFee}}</td>
        </tr>
        {{end}}
        <tr class="grand">
          <td colspan="3" style="text-align:right;">Estimated Grand Total:</td>
          <td style="text-align:right; color:#111827;">${{printf "%.2f" .Quote.GrandTotal}}</td>
        </tr>
      </table>

      {{if .Quote.AdminNotes}}
      <div class="notes-box">
        <strong>Shop Remarks / Terms:</strong><br>
        {{.Quote.AdminNotes}}
      </div>
      {{end}}

      <div class="cta-container">
        <a href="https://wa.me/{{.ShopWhatsApp}}?text=Hello%20Kadianga%20Electricals,%20I%20accept%20Quotation%20{{.Quote.QuoteNumber}}%20for%20Grand%20Total%20${{printf "%.2f" .Quote.GrandTotal}}.%20Please%20proceed%20with%20order." class="accept-btn">
          Confirm &amp; Order via WhatsApp
        </a>
      </div>
    </div>
    <div class="footer">
      {{.ShopName}} • {{.ShopAddress}}<br>
      Prices valid for 14 days from issue date. Thank you for choosing us!
    </div>
  </div>
</body>
</html>
`

	body, err := e.renderTemplate(tmpl, map[string]interface{}{
		"ShopName":     e.cfg.ShopName,
		"ShopWhatsApp": e.cfg.ShopWhatsApp,
		"ShopAddress":  e.cfg.ShopAddress,
		"Quote":        quote,
	})
	if err != nil {
		return err
	}

	return e.sendMail(quote.CustomerEmail, subject, body)
}

func (e *EmailService) renderTemplate(tmplText string, data interface{}) (string, error) {
	t, err := template.New("email").Parse(tmplText)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return "", err
	}
	return buf.String(), nil
}

func sanitizeHeader(val string) string {
	val = strings.ReplaceAll(val, "\r", "")
	val = strings.ReplaceAll(val, "\n", "")
	return strings.TrimSpace(val)
}

func (e *EmailService) sendMail(to, subject, htmlBody string) error {
	to = sanitizeHeader(to)
	subject = sanitizeHeader(subject)
	from := sanitizeHeader(e.cfg.SMTPFrom)

	if to == "" {
		return fmt.Errorf("recipient email address cannot be empty")
	}

	// If SMTP is not configured in environment, notify caller transparently
	if e.cfg.SMTPHost == "" || e.cfg.SMTPUser == "" {
		log.Printf("[SMTP-CONFIG-REQUIRED] To: %s | Subject: %s | Server SMTP not configured (SMTP_HOST/SMTP_USER empty)", to, subject)
		return fmt.Errorf("SMTP credentials not configured on backend server. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in backend/.env, or use direct Gmail/Client email dispatch")
	}

	auth := smtp.PlainAuth("", e.cfg.SMTPUser, e.cfg.SMTPPass, e.cfg.SMTPHost)
	mime := "MIME-version: 1.0;\r\nContent-Type: text/html; charset=\"UTF-8\";\r\n\r\n"
	msg := []byte(fmt.Sprintf("To: %s\r\nFrom: %s\r\nSubject: %s\r\n%s%s", to, from, subject, mime, htmlBody))

	addr := fmt.Sprintf("%s:%s", e.cfg.SMTPHost, e.cfg.SMTPPort)
	return smtp.SendMail(addr, auth, from, []string{to}, msg)
}
