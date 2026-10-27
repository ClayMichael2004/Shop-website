package service

import (
	cryptorand "crypto/rand"
	"database/sql"
	"fmt"
	"log"
	"net/mail"
	"strings"
	"time"

	"electrical-shop-backend/internal/database"
	"electrical-shop-backend/internal/models"
)

type QuoteService struct {
	db        *database.DB
	emailSvc  *EmailService
	whatsApp  *WhatsAppService
	prodSvc   *ProductService
}

func NewQuoteService(db *database.DB, emailSvc *EmailService, whatsApp *WhatsAppService, prodSvc *ProductService) *QuoteService {
	return &QuoteService{
		db:       db,
		emailSvc: emailSvc,
		whatsApp: whatsApp,
		prodSvc:  prodSvc,
	}
}

type CreateQuoteResponse struct {
	QuoteNumber  string               `json:"quote_number"`
	ID           int64                `json:"id"`
	WhatsAppLink string               `json:"whatsapp_link"`
	WhatsAppText string               `json:"whatsapp_text"`
	Status       string               `json:"status"`
	Message      string               `json:"message"`
	Quote        *models.QuoteRequest `json:"quote"`
}

func (s *QuoteService) CreateQuote(input *models.CreateQuoteInput) (*CreateQuoteResponse, error) {
	input.CustomerName = strings.TrimSpace(input.CustomerName)
	input.CustomerPhone = strings.TrimSpace(input.CustomerPhone)
	input.CustomerEmail = strings.TrimSpace(input.CustomerEmail)
	input.CustomerLocation = strings.TrimSpace(input.CustomerLocation)
	input.Notes = strings.TrimSpace(input.Notes)

	if input.CustomerName == "" {
		return nil, fmt.Errorf("customer name is required")
	}
	if len(input.CustomerName) > 150 {
		input.CustomerName = input.CustomerName[:150]
	}
	if input.CustomerPhone == "" && input.CustomerEmail == "" {
		return nil, fmt.Errorf("either phone number or email is required to receive quotation")
	}
	if input.CustomerEmail != "" {
		if _, err := mail.ParseAddress(input.CustomerEmail); err != nil || !strings.Contains(input.CustomerEmail, ".") {
			return nil, fmt.Errorf("invalid email address format")
		}
		if len(input.CustomerEmail) > 150 {
			input.CustomerEmail = input.CustomerEmail[:150]
		}
	}
	if len(input.CustomerPhone) > 40 {
		input.CustomerPhone = input.CustomerPhone[:40]
	}
	if len(input.CustomerLocation) > 250 {
		input.CustomerLocation = input.CustomerLocation[:250]
	}
	if len(input.Notes) > 1500 {
		input.Notes = input.Notes[:1500]
	}
	if len(input.Items) == 0 {
		return nil, fmt.Errorf("at least one product must be selected for quotation")
	}
	if len(input.Items) > 50 {
		return nil, fmt.Errorf("maximum 50 items allowed per quotation submission")
	}

	// Idempotency check for offline sync
	if input.ClientUUID != "" {
		var existingID int64
		var existingNum string
		err := s.db.QueryRow("SELECT id, quote_number FROM quote_requests WHERE client_uuid = ?", input.ClientUUID).Scan(&existingID, &existingNum)
		if err == nil {
			// Already synced
			existingQuote, _ := s.GetQuoteByID(existingID)
			rawMsg, waLink := s.whatsApp.BuildCustomerQuoteMessage(existingQuote)
			return &CreateQuoteResponse{
				QuoteNumber:  existingNum,
				ID:           existingID,
				WhatsAppLink: waLink,
				WhatsAppText: rawMsg,
				Status:       existingQuote.Status,
				Message:      "Quote was previously synced successfully.",
				Quote:        existingQuote,
			}, nil
		}
	}

	quoteNumber := generateQuoteNumber()

	tx, err := s.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	preferred := input.PreferredContact
	if preferred == "" {
		if input.CustomerEmail != "" && input.CustomerPhone != "" {
			preferred = "both"
		} else if input.CustomerPhone != "" {
			preferred = "whatsapp"
		} else {
			preferred = "email"
		}
	}

	query := `
		INSERT INTO quote_requests (
			quote_number, customer_name, customer_email, customer_phone, customer_location,
			notes, preferred_contact, status, client_uuid, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id
	`
	var quoteID int64
	err = tx.QueryRow(query,
		quoteNumber, input.CustomerName, input.CustomerEmail, input.CustomerPhone,
		input.CustomerLocation, input.Notes, preferred, input.ClientUUID,
	).Scan(&quoteID)
	if err != nil {
		return nil, fmt.Errorf("failed to insert quote request: %w", err)
	}

	var quoteItems []models.QuoteItem
	var subtotal float64

	itemQuery := `
		INSERT INTO quote_items (
			quote_id, product_id, product_name, product_sku, product_image,
			quantity, quoted_unit_price, quoted_total_price, specs_notes
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		RETURNING id
	`

	for _, it := range input.Items {
		prod, err := s.prodSvc.GetProductByID(it.ProductID)
		name := fmt.Sprintf("Product #%d", it.ProductID)
		sku := "UNKNOWN"
		image := "/images/items section layout.jpg"
		unitPrice := 0.0

		if err == nil && prod != nil {
			name = prod.Name
			sku = prod.SKU
			image = prod.ImageURL
			unitPrice = prod.BaseEstimatePrice
		}

		qty := it.Quantity
		if qty < 1 {
			qty = 1
		}
		if qty > 50000 {
			qty = 50000
		}
		specsNote := it.SpecsNotes
		if len(specsNote) > 500 {
			specsNote = specsNote[:500]
		}
		total := unitPrice * float64(qty)
		subtotal += total

		var itemID int64
		err = tx.QueryRow(
			itemQuery,
			quoteID, it.ProductID, name, sku, image,
			qty, unitPrice, total, specsNote,
		).Scan(&itemID)
		if err != nil {
			return nil, fmt.Errorf("failed to insert quote item: %w", err)
		}

		quoteItems = append(quoteItems, models.QuoteItem{
			ID:           itemID,
			QuoteID:      quoteID,
			ProductID:    it.ProductID,
			ProductName:  name,
			ProductSKU:   sku,
			ProductImage: image,
			Quantity:     qty,
			QuotedUnit:   unitPrice,
			QuotedTotal:  total,
			SpecsNotes:   it.SpecsNotes,
		})
	}

	// Update calculated initial subtotal
	_, err = tx.Exec("UPDATE quote_requests SET subtotal = ?, grand_total = ? WHERE id = ?", subtotal, subtotal, quoteID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	fullQuote := &models.QuoteRequest{
		ID:               quoteID,
		QuoteNumber:      quoteNumber,
		CustomerName:     input.CustomerName,
		CustomerEmail:    input.CustomerEmail,
		CustomerPhone:    input.CustomerPhone,
		CustomerLocation: input.CustomerLocation,
		Notes:            input.Notes,
		PreferredContact: preferred,
		Status:           "pending",
		Subtotal:         subtotal,
		GrandTotal:       subtotal,
		ClientUUID:       input.ClientUUID,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		Items:            quoteItems,
	}

	// Asynchronously trigger confirmation email if email provided
	if fullQuote.CustomerEmail != "" {
		go func(q *models.QuoteRequest) {
			if err := s.emailSvc.SendQuoteReceiptConfirmation(q); err != nil {
				log.Printf("[EMAIL-ERROR] Failed to send receipt confirmation to %s: %v", q.CustomerEmail, err)
			}
		}(fullQuote)
	}

	rawMsg, waLink := s.whatsApp.BuildCustomerQuoteMessage(fullQuote)

	return &CreateQuoteResponse{
		QuoteNumber:  quoteNumber,
		ID:           quoteID,
		WhatsAppLink: waLink,
		WhatsAppText: rawMsg,
		Status:       "pending",
		Message:      "Your quotation request has been received. Our team is preparing your figures.",
		Quote:        fullQuote,
	}, nil
}

func (s *QuoteService) GetQuoteByID(id int64) (*models.QuoteRequest, error) {
	var q models.QuoteRequest
	query := `
		SELECT id, quote_number, customer_name, customer_email, customer_phone, customer_location,
		       COALESCE(notes, ''), preferred_contact, status, subtotal, discount, delivery_fee, grand_total,
		       COALESCE(admin_notes, ''), COALESCE(client_uuid, ''), whatsapp_sent, email_sent, quoted_at, created_at, updated_at
		FROM quote_requests
		WHERE id = ?
	`
	err := s.db.QueryRow(query, id).Scan(
		&q.ID, &q.QuoteNumber, &q.CustomerName, &q.CustomerEmail, &q.CustomerPhone, &q.CustomerLocation,
		&q.Notes, &q.PreferredContact, &q.Status, &q.Subtotal, &q.Discount, &q.DeliveryFee, &q.GrandTotal,
		&q.AdminNotes, &q.ClientUUID, &q.WhatsAppSent, &q.EmailSent, &q.QuotedAt, &q.CreatedAt, &q.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	items, err := s.getQuoteItems(id)
	if err != nil {
		return nil, err
	}
	q.Items = items

	return &q, nil
}

func (s *QuoteService) GetQuoteByNumber(quoteNum string) (*models.QuoteRequest, error) {
	var id int64
	err := s.db.QueryRow("SELECT id FROM quote_requests WHERE quote_number = ?", quoteNum).Scan(&id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return s.GetQuoteByID(id)
}

func (s *QuoteService) ListQuotes(status string, search string, page int, limit int) ([]models.QuoteRequest, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	where := "1=1"
	var args []interface{}
	if status != "" && strings.ToLower(status) != "all" {
		where += " AND status = ?"
		args = append(args, status)
	}

	search = strings.TrimSpace(search)
	if search != "" {
		where += " AND (customer_name LIKE ? OR quote_number LIKE ? OR customer_phone LIKE ? OR customer_email LIKE ? OR customer_location LIKE ?)"
		pattern := "%" + search + "%"
		args = append(args, pattern, pattern, pattern, pattern, pattern)
	}

	var total int
	err := s.db.QueryRow(fmt.Sprintf("SELECT COUNT(*) FROM quote_requests WHERE %s", where), args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT id, quote_number, customer_name, customer_email, customer_phone, customer_location,
		       COALESCE(notes, ''), preferred_contact, status, subtotal, discount, delivery_fee, grand_total,
		       COALESCE(admin_notes, ''), COALESCE(client_uuid, ''), whatsapp_sent, email_sent, quoted_at, created_at, updated_at
		FROM quote_requests
		WHERE %s
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`, where)

	queryArgs := append(args, limit, offset)
	rows, err := s.db.Query(query, queryArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var quotes []models.QuoteRequest
	for rows.Next() {
		var q models.QuoteRequest
		err := rows.Scan(
			&q.ID, &q.QuoteNumber, &q.CustomerName, &q.CustomerEmail, &q.CustomerPhone, &q.CustomerLocation,
			&q.Notes, &q.PreferredContact, &q.Status, &q.Subtotal, &q.Discount, &q.DeliveryFee, &q.GrandTotal,
			&q.AdminNotes, &q.ClientUUID, &q.WhatsAppSent, &q.EmailSent, &q.QuotedAt, &q.CreatedAt, &q.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		quotes = append(quotes, q)
	}

	// Fetch items for each quote
	for i := range quotes {
		items, _ := s.getQuoteItems(quotes[i].ID)
		quotes[i].Items = items
	}

	if quotes == nil {
		quotes = []models.QuoteRequest{}
	}

	return quotes, total, nil
}

func (s *QuoteService) UpdateQuotePricing(id int64, items []models.QuoteItem, discount, deliveryFee float64, adminNotes string, status string) (*models.QuoteRequest, error) {
	if discount < 0 {
		discount = 0
	}
	if deliveryFee < 0 {
		deliveryFee = 0
	}

	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var subtotal float64
	for _, item := range items {
		if item.QuotedUnit < 0 {
			item.QuotedUnit = 0
		}
		if item.Quantity < 1 {
			item.Quantity = 1
		}
		lineTotal := item.QuotedUnit * float64(item.Quantity)
		subtotal += lineTotal

		_, err := tx.Exec(`
			UPDATE quote_items
			SET quoted_unit_price = ?, quoted_total_price = ?, quantity = ?, specs_notes = ?
			WHERE id = ? AND quote_id = ?
		`, item.QuotedUnit, lineTotal, item.Quantity, item.SpecsNotes, item.ID, id)
		if err != nil {
			return nil, err
		}
	}

	grandTotal := subtotal - discount + deliveryFee
	if grandTotal < 0 {
		grandTotal = 0
	}

	if status == "" {
		status = "quoted"
	}

	now := time.Now()
	_, err = tx.Exec(`
		UPDATE quote_requests
		SET subtotal = ?, discount = ?, delivery_fee = ?, grand_total = ?,
		    admin_notes = ?, status = ?, quoted_at = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`, subtotal, discount, deliveryFee, grandTotal, adminNotes, status, now, id)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return s.GetQuoteByID(id)
}

func (s *QuoteService) SendQuoteEmail(id int64) error {
	quote, err := s.GetQuoteByID(id)
	if err != nil || quote == nil {
		return fmt.Errorf("quote not found")
	}
	if quote.CustomerEmail == "" {
		return fmt.Errorf("quote has no customer email address")
	}

	if err := s.emailSvc.SendFinalizedQuoteToCustomer(quote); err != nil {
		return err
	}

	_, err = s.db.Exec("UPDATE quote_requests SET email_sent = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", id)
	return err
}

func (s *QuoteService) SyncOfflineBatch(payload *models.QuoteSyncPayload) ([]CreateQuoteResponse, error) {
	var responses []CreateQuoteResponse
	for _, input := range payload.Quotes {
		res, err := s.CreateQuote(&input)
		if err != nil {
			log.Printf("[SYNC-WARN] Failed to sync quote for %s: %v", input.CustomerName, err)
			continue
		}
		responses = append(responses, *res)
	}
	return responses, nil
}

func (s *QuoteService) GetAdminStats() (*models.AdminStats, error) {
	var stats models.AdminStats

	s.db.QueryRow("SELECT COUNT(*) FROM quote_requests").Scan(&stats.TotalQuotes)
	s.db.QueryRow("SELECT COUNT(*) FROM quote_requests WHERE status = 'pending'").Scan(&stats.PendingQuotes)
	s.db.QueryRow("SELECT COUNT(*) FROM quote_requests WHERE status = 'quoted'").Scan(&stats.QuotedQuotes)
	s.db.QueryRow("SELECT COUNT(*) FROM products").Scan(&stats.TotalProducts)
	s.db.QueryRow("SELECT COALESCE(SUM(grand_total), 0) FROM quote_requests WHERE status IN ('quoted', 'accepted')").Scan(&stats.TotalQuotedVal)

	return &stats, nil
}

func (s *QuoteService) getQuoteItems(quoteID int64) ([]models.QuoteItem, error) {
	rows, err := s.db.Query(`
		SELECT id, quote_id, product_id, product_name, product_sku, product_image,
		       quantity, quoted_unit_price, quoted_total_price, COALESCE(specs_notes, '')
		FROM quote_items
		WHERE quote_id = ?
		ORDER BY id ASC
	`, quoteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.QuoteItem
	for rows.Next() {
		var it models.QuoteItem
		err := rows.Scan(
			&it.ID, &it.QuoteID, &it.ProductID, &it.ProductName, &it.ProductSKU, &it.ProductImage,
			&it.Quantity, &it.QuotedUnit, &it.QuotedTotal, &it.SpecsNotes,
		)
		if err != nil {
			return nil, err
		}
		items = append(items, it)
	}

	if items == nil {
		items = []models.QuoteItem{}
	}
	return items, nil
}

func (s *QuoteService) GetPublicQuoteByNumber(quoteNum string) (*models.PublicQuoteResponse, error) {
	q, err := s.GetQuoteByNumber(quoteNum)
	if err != nil {
		return nil, err
	}
	if q == nil {
		return nil, nil
	}
	return q.ToPublicResponse(), nil
}

func generateQuoteNumber() string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // 32 chars (unambiguous, no 0/O, 1/I)
	b := make([]byte, 8)
	if _, err := cryptorand.Read(b); err != nil {
		// Secure fallback using time and nano
		return fmt.Sprintf("EQ-%d-%d", time.Now().Year(), time.Now().UnixNano()%100000000)
	}
	for i := range b {
		b[i] = charset[int(b[i])%len(charset)]
	}
	year := time.Now().Year()
	return fmt.Sprintf("EQ-%d-%s-%s", year, string(b[:4]), string(b[4:]))
}

func generateInquiryNumber() string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, 6)
	if _, err := cryptorand.Read(b); err != nil {
		return fmt.Sprintf("INQ-%d-%d", time.Now().Year(), time.Now().UnixNano()%100000)
	}
	for i := range b {
		b[i] = charset[int(b[i])%len(charset)]
	}
	return fmt.Sprintf("INQ-%d-%s", time.Now().Year(), string(b))
}

// CreateContactInquiry processes inquiries from the Contact Us page and stores them in the quote/inquiry operations queue.
func (s *QuoteService) CreateContactInquiry(input *models.ContactInquiryInput) (*CreateQuoteResponse, error) {
	name := strings.TrimSpace(input.Name)
	company := strings.TrimSpace(input.Company)
	email := strings.TrimSpace(input.Email)
	phone := strings.TrimSpace(input.Phone)
	inquiryType := strings.TrimSpace(input.InquiryType)
	message := strings.TrimSpace(input.Message)

	if name == "" {
		return nil, fmt.Errorf("name is required")
	}
	if email == "" && phone == "" {
		return nil, fmt.Errorf("either phone number or email is required")
	}
	if message == "" {
		return nil, fmt.Errorf("message is required")
	}

	fullName := name
	if company != "" {
		fullName = fmt.Sprintf("%s (%s)", name, company)
	}

	if inquiryType == "" {
		inquiryType = "General Consultation"
	}

	notes := fmt.Sprintf("[Inquiry Category: %s]\n%s", strings.Title(inquiryType), message)
	location := fmt.Sprintf("Contact Page • %s", strings.Title(inquiryType))

	inquiryNum := generateInquiryNumber()

	tx, err := s.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	insertQuery := `
		INSERT INTO quote_requests (
			quote_number, customer_name, customer_email, customer_phone,
			customer_location, notes, preferred_contact, status,
			subtotal, discount, delivery_fee, grand_total,
			admin_notes, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, 'both', 'pending', 0.0, 0.0, 0.0, 0.0, 'Submitted via Contact Us page', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id
	`
	var quoteID int64
	err = tx.QueryRow(insertQuery, inquiryNum, fullName, email, phone, location, notes).Scan(&quoteID)
	if err != nil {
		return nil, fmt.Errorf("failed to insert contact inquiry: %w", err)
	}

	// Insert descriptive quote item so items table has reference
	itemQuery := `
		INSERT INTO quote_items (
			quote_id, product_id, product_name, product_sku, product_image,
			quantity, quoted_unit_price, quoted_total_price, specs_notes
		) VALUES (?, 0, ?, 'INQ-CONSULT', '/images/contacthero.jpg', 1, 0.0, 0.0, ?)
	`
	itemDesc := fmt.Sprintf("Direct %s Inquiry", strings.Title(inquiryType))
	if _, err := tx.Exec(itemQuery, quoteID, itemDesc, message); err != nil {
		return nil, fmt.Errorf("failed to insert inquiry item: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	fullQuote, err := s.GetQuoteByID(quoteID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve created inquiry: %w", err)
	}

	rawMsg, waLink := s.whatsApp.BuildContactInquiryMessage(name, company, phone, email, inquiryType, message, inquiryNum)

	return &CreateQuoteResponse{
		QuoteNumber:  inquiryNum,
		ID:           quoteID,
		WhatsAppLink: waLink,
		WhatsAppText: rawMsg,
		Status:       "pending",
		Message:      "Your inquiry has been received and logged in the Kadianga Operations Dashboard.",
		Quote:        fullQuote,
	}, nil
}
