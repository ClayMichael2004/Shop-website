package handlers

import (
	cryptorand "crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"electrical-shop-backend/internal/config"
	"electrical-shop-backend/internal/models"
	"electrical-shop-backend/internal/service"
)

type APIHandler struct {
	cfg      *config.Config
	prodSvc  *service.ProductService
	quoteSvc *service.QuoteService
	whatsApp *service.WhatsAppService
}

func NewAPIHandler(cfg *config.Config, prodSvc *service.ProductService, quoteSvc *service.QuoteService, whatsApp *service.WhatsAppService) *APIHandler {
	return &APIHandler{
		cfg:      cfg,
		prodSvc:  prodSvc,
		quoteSvc: quoteSvc,
		whatsApp: whatsApp,
	}
}

// Health check endpoint
func (h *APIHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "healthy",
		"shop_name": h.cfg.ShopName,
		"version":   "1.0.0",
		"offline_first_ready": true,
	})
}

// Public Products list with pagination and filtering
func (h *APIHandler) ListProducts(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	category := q.Get("category")
	search := q.Get("search")
	sort := q.Get("sort")
	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))

	res, err := h.prodSvc.ListProducts(category, search, page, limit, sort)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("X-Total-Count", strconv.Itoa(res.Total))
	w.Header().Set("X-Page", strconv.Itoa(res.Page))
	w.Header().Set("X-Total-Pages", strconv.Itoa(res.TotalPages))

	respondJSON(w, http.StatusOK, res)
}

// Public Get single product by ID or Slug
func (h *APIHandler) GetProduct(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/products/")
	id, err := strconv.ParseInt(path, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid product identifier")
		return
	}

	prod, err := h.prodSvc.GetProductByID(id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if prod == nil {
		respondError(w, http.StatusNotFound, "Product not found")
		return
	}

	respondJSON(w, http.StatusOK, prod)
}

// Public List categories with product counts
func (h *APIHandler) ListCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.prodSvc.ListCategories()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, categories)
}

// Public Create Quotation (No authentication required!)
func (h *APIHandler) CreateQuote(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1MB payload limit
	var input models.CreateQuoteInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid quotation submission payload: "+err.Error())
		return
	}

	res, err := h.quoteSvc.CreateQuote(&input)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, res)
}

// Public Track Quote by Quote Number (Returns sanitized non-PII tracking details)
func (h *APIHandler) TrackQuote(w http.ResponseWriter, r *http.Request) {
	quoteNum := r.URL.Query().Get("number")
	if quoteNum == "" {
		quoteNum = strings.TrimPrefix(r.URL.Path, "/api/quotes/track/")
	}
	quoteNum = strings.TrimSpace(quoteNum)
	if quoteNum == "" {
		respondError(w, http.StatusBadRequest, "Quote number is required")
		return
	}

	quote, err := h.quoteSvc.GetPublicQuoteByNumber(quoteNum)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if quote == nil {
		respondError(w, http.StatusNotFound, "Quote not found. Please verify the quote reference number.")
		return
	}

	respondJSON(w, http.StatusOK, quote)
}

// Public Batch sync for offline-first submissions
func (h *APIHandler) SyncQuotes(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 2<<20) // 2MB payload limit
	var payload models.QuoteSyncPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid sync payload: "+err.Error())
		return
	}

	res, err := h.quoteSvc.SyncOfflineBatch(&payload)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"synced_count": len(res),
		"results":      res,
	})
}

// Admin: List all quotations
func (h *APIHandler) AdminListQuotes(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	search := r.URL.Query().Get("search")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	quotes, total, err := h.quoteSvc.ListQuotes(status, search, page, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"quotes": quotes,
		"total":  total,
	})
}

// Admin: Get quote by ID with WhatsApp reply link generated
func (h *APIHandler) AdminGetQuote(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/admin/quotes/")
	parts := strings.Split(path, "/")
	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid quote ID")
		return
	}

	quote, err := h.quoteSvc.GetQuoteByID(id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if quote == nil {
		respondError(w, http.StatusNotFound, "Quote not found")
		return
	}

	replyMsg, replyLink := h.whatsApp.BuildShopOwnerReplyMessage(quote)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"quote":         quote,
		"whatsapp_text": replyMsg,
		"whatsapp_link": replyLink,
	})
}

// Admin: Update quote pricing, notes and status
func (h *APIHandler) AdminUpdateQuotePricing(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/admin/quotes/")
	parts := strings.Split(path, "/")
	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid quote ID")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1MB payload limit
	var req struct {
		Items       []models.QuoteItem `json:"items"`
		Discount    float64            `json:"discount"`
		DeliveryFee float64            `json:"delivery_fee"`
		AdminNotes  string             `json:"admin_notes"`
		Status      string             `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid update payload: "+err.Error())
		return
	}

	updated, err := h.quoteSvc.UpdateQuotePricing(id, req.Items, req.Discount, req.DeliveryFee, req.AdminNotes, req.Status)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	replyMsg, replyLink := h.whatsApp.BuildShopOwnerReplyMessage(updated)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":       "Quote updated successfully",
		"quote":         updated,
		"whatsapp_text": replyMsg,
		"whatsapp_link": replyLink,
	})
}

// Admin: Trigger sending quote via email to customer
func (h *APIHandler) AdminSendQuoteEmail(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/admin/quotes/")
	parts := strings.Split(path, "/")
	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid quote ID")
		return
	}

	if err := h.quoteSvc.SendQuoteEmail(id); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to send email: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Quote email dispatched to customer successfully",
	})
}

// Helper: convert data:image base64 string to a stored static file
func (h *APIHandler) saveBase64Image(dataURL string) (string, error) {
	parts := strings.SplitN(dataURL, ",", 2)
	if len(parts) != 2 {
		return "", fmt.Errorf("invalid base64 image data")
	}

	header := parts[0]
	ext := ".jpg"
	if strings.Contains(header, "png") {
		ext = ".png"
	} else if strings.Contains(header, "webp") {
		ext = ".webp"
	} else if strings.Contains(header, "gif") {
		ext = ".gif"
	}

	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 image: %w", err)
	}

	randomHex := make([]byte, 4)
	cryptorand.Read(randomHex)
	newFilename := fmt.Sprintf("prod_%d_%x%s", time.Now().Unix(), randomHex, ext)

	targetDirs := []string{
		"./assets",
		"../assets",
		"./frontend/public/images",
		"../frontend/public/images",
		"./frontend/dist/images",
		"../frontend/dist/images",
	}
	saved := false

	for _, dir := range targetDirs {
		if fi, err := os.Stat(dir); err == nil && fi.IsDir() {
			dstPath := filepath.Join(dir, newFilename)
			if err := os.WriteFile(dstPath, data, 0644); err == nil {
				saved = true
			}
		}
	}

	if !saved {
		_ = os.MkdirAll("./assets", 0755)
		if err := os.WriteFile(filepath.Join("./assets", newFilename), data, 0644); err != nil {
			return "", err
		}
	}

	return "/images/" + newFilename, nil
}

// Admin: Create product
func (h *APIHandler) AdminCreateProduct(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)
	var p models.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid product payload: "+err.Error())
		return
	}

	// Auto-convert base64 data URLs to stored static images
	if strings.HasPrefix(p.ImageURL, "data:image/") {
		savedURL, err := h.saveBase64Image(p.ImageURL)
		if err == nil && savedURL != "" {
			p.ImageURL = savedURL
		}
	}

	id, err := h.prodSvc.CreateProduct(&p)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	p.ID = id

	respondJSON(w, http.StatusCreated, p)
}

// Admin: Update product
func (h *APIHandler) AdminUpdateProduct(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/admin/products/")
	id, err := strconv.ParseInt(path, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)
	var p models.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid product payload: "+err.Error())
		return
	}

	// Auto-convert base64 data URLs to stored static images
	if strings.HasPrefix(p.ImageURL, "data:image/") {
		savedURL, err := h.saveBase64Image(p.ImageURL)
		if err == nil && savedURL != "" {
			p.ImageURL = savedURL
		}
	}

	if err := h.prodSvc.UpdateProduct(id, &p); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"message": "Product updated successfully"})
}

// Admin: Delete product
func (h *APIHandler) AdminDeleteProduct(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/admin/products/")
	id, err := strconv.ParseInt(path, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	if err := h.prodSvc.DeleteProduct(id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"message": "Product deleted successfully"})
}

// Admin: Verify current token
func (h *APIHandler) AdminVerify(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"valid":   true,
		"message": "Admin session authenticated successfully",
	})
}

// Admin: Upload product image from local PC
func (h *APIHandler) AdminUploadImage(w http.ResponseWriter, r *http.Request) {
	// Limit upload size to 8MB
	r.Body = http.MaxBytesReader(w, r.Body, 8<<20)
	if err := r.ParseMultipartForm(8 << 20); err != nil {
		respondError(w, http.StatusBadRequest, "Image file exceeds 8MB limit")
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		file, header, err = r.FormFile("file")
	}
	if err != nil {
		respondError(w, http.StatusBadRequest, "No image file provided in form field 'image'")
		return
	}
	defer file.Close()

	buf := make([]byte, 512)
	n, _ := file.Read(buf)
	contentType := http.DetectContentType(buf[:n])
	if !strings.HasPrefix(contentType, "image/") {
		respondError(w, http.StatusBadRequest, "File content is not a valid image")
		return
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to read image stream")
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == ".jfif" {
		ext = ".jpg"
	}
	if ext == "" || (ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" && ext != ".gif") {
		switch contentType {
		case "image/jpeg":
			ext = ".jpg"
		case "image/png":
			ext = ".png"
		case "image/webp":
			ext = ".webp"
		case "image/gif":
			ext = ".gif"
		default:
			respondError(w, http.StatusBadRequest, "Unsupported image format. Allowed: .jpg, .png, .webp, .gif")
			return
		}
	}

	randomHex := make([]byte, 4)
	cryptorand.Read(randomHex)
	newFilename := fmt.Sprintf("prod_%d_%x%s", time.Now().Unix(), randomHex, ext)

	// Save to assets and public images directories
	targetDirs := []string{
		"./assets",
		"../assets",
		"./frontend/public/images",
		"../frontend/public/images",
		"./frontend/dist/images",
		"../frontend/dist/images",
	}
	saved := false

	for _, dir := range targetDirs {
		if fi, err := os.Stat(dir); err == nil && fi.IsDir() {
			dstPath := filepath.Join(dir, newFilename)
			dstFile, err := os.Create(dstPath)
			if err == nil {
				file.Seek(0, io.SeekStart)
				io.Copy(dstFile, file)
				dstFile.Close()
				saved = true
			}
		}
	}

	if !saved {
		_ = os.MkdirAll("./assets", 0755)
		dstFile, err := os.Create(filepath.Join("./assets", newFilename))
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to write image file")
			return
		}
		file.Seek(0, io.SeekStart)
		io.Copy(dstFile, file)
		dstFile.Close()
	}

	imageURL := "/images/" + newFilename
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"url":      imageURL,
		"filename": newFilename,
		"message":  "Image uploaded successfully",
	})
}

// Admin: Dashboard metrics
func (h *APIHandler) AdminStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.quoteSvc.GetAdminStats()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, stats)
}

// Helper to write JSON response
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// Helper to write Error response (protects internal technical details from disclosure)
func respondError(w http.ResponseWriter, status int, message string) {
	if status >= 500 {
		log.Printf("[SERVER ERROR %d]: %s", status, message)
		message = "An internal server error occurred. Please try again later."
	}
	respondJSON(w, status, map[string]interface{}{
		"error":  message,
		"status": status,
	})
}
