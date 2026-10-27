package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"electrical-shop-backend/internal/cache"
	"electrical-shop-backend/internal/config"
	"electrical-shop-backend/internal/database"
	"electrical-shop-backend/internal/handlers"
	"electrical-shop-backend/internal/middleware"
	"electrical-shop-backend/internal/service"
)

func main() {
	cfg := config.Load()
	log.Printf("Starting %s on port %s...", cfg.ShopName, cfg.Port)

	// Initialize Database (Cloud PostgreSQL if DATABASE_URL is set, otherwise SQLite WAL)
	db, err := database.InitDB(cfg.DatabaseURL, cfg.DBPath)
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}
	defer db.Close()

	// Initialize Cache (In-memory thread-safe with TTL & background janitor)
	memCache := cache.NewMemoryCache()

	// Initialize Services
	prodService := service.NewProductService(db, memCache)
	emailService := service.NewEmailService(cfg)
	whatsAppService := service.NewWhatsAppService(cfg)
	quoteService := service.NewQuoteService(db, emailService, whatsAppService, prodService)
	mediaService := service.NewMediaService(cfg)

	// Initialize API Handler
	handler := handlers.NewAPIHandler(cfg, prodService, quoteService, whatsAppService, mediaService)

	// Rate Limiters
	globalLimiter := middleware.NewIPRateLimiter(180, 40) // 180 req/min, burst 40
	quoteLimiter := middleware.NewIPRateLimiter(20, 5)    // 20 quotes/min, burst 5

	// Router setup using standard net/http multiplexer
	mux := http.NewServeMux()

	// Static images handler with directory listing prevention
	imagesDir := "./assets"
	for _, dir := range []string{"./assets", "../assets", "/assets", "/app/assets"} {
		if fi, err := os.Stat(dir); err == nil && fi.IsDir() {
			imagesDir = dir
			break
		}
	}
	fileServer := http.StripPrefix("/images/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Prevent directory browsing / indexing
		if strings.HasSuffix(r.URL.Path, "/") || r.URL.Path == "" {
			http.NotFound(w, r)
			return
		}
		http.FileServer(http.Dir(imagesDir)).ServeHTTP(w, r)
	}))
	mux.Handle("/images/", fileServer)

	// Health Check
	mux.HandleFunc("/api/health", handler.HealthCheck)

	// Public Catalog Routes
	mux.HandleFunc("/api/products", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handler.ListProducts(w, r)
			return
		}
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	})

	mux.HandleFunc("/api/products/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handler.GetProduct(w, r)
			return
		}
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	})

	mux.HandleFunc("/api/categories", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handler.ListCategories(w, r)
			return
		}
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	})

	// Public Quotation Routes (Strict rate-limited & no authentication required)
	quoteCreateHandler := middleware.RateLimitMiddleware(quoteLimiter)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handler.CreateQuote(w, r)
			return
		}
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}))
	mux.Handle("/api/quotes", quoteCreateHandler)

	quoteTrackHandler := middleware.RateLimitMiddleware(quoteLimiter)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handler.TrackQuote(w, r)
			return
		}
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}))
	mux.Handle("/api/quotes/track/", quoteTrackHandler)

	quoteSyncHandler := middleware.RateLimitMiddleware(quoteLimiter)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handler.SyncQuotes(w, r)
			return
		}
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}))
	mux.Handle("/api/quotes/sync", quoteSyncHandler)

	// Public Contact Inquiry Route (Rate-limited, logged to Admin Dashboard)
	contactLimiter := middleware.NewIPRateLimiter(20, 5)
	contactHandler := middleware.RateLimitMiddleware(contactLimiter)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handler.HandleContactSubmission(w, r)
			return
		}
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}))
	mux.Handle("/api/contact", contactHandler)

	// Admin Routes (Protected with AdminAuthMiddleware)
	adminAuth := middleware.AdminAuthMiddleware(cfg.AdminToken)

	adminMux := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		if path == "/api/admin/verify" && r.Method == http.MethodGet {
			handler.AdminVerify(w, r)
			return
		}

		if path == "/api/admin/upload" && r.Method == http.MethodPost {
			handler.AdminUploadImage(w, r)
			return
		}

		if path == "/api/admin/stats" && r.Method == http.MethodGet {
			handler.AdminStats(w, r)
			return
		}

		if path == "/api/admin/quotes" && r.Method == http.MethodGet {
			handler.AdminListQuotes(w, r)
			return
		}

		if strings.HasPrefix(path, "/api/admin/quotes/") {
			if strings.HasSuffix(path, "/send-email") && r.Method == http.MethodPost {
				handler.AdminSendQuoteEmail(w, r)
				return
			}
			if r.Method == http.MethodGet {
				handler.AdminGetQuote(w, r)
				return
			}
			if r.Method == http.MethodPut || r.Method == http.MethodPatch {
				handler.AdminUpdateQuotePricing(w, r)
				return
			}
		}

		if path == "/api/admin/products" && r.Method == http.MethodPost {
			handler.AdminCreateProduct(w, r)
			return
		}

		if strings.HasPrefix(path, "/api/admin/products/") {
			if r.Method == http.MethodPut || r.Method == http.MethodPatch {
				handler.AdminUpdateProduct(w, r)
				return
			}
			if r.Method == http.MethodDelete {
				handler.AdminDeleteProduct(w, r)
				return
			}
		}

		http.Error(w, "Admin Endpoint Not Found", http.StatusNotFound)
	})

	mux.Handle("/api/admin/", adminAuth(adminMux))

	// Frontend SPA & Static Files Serving
	frontendDir := ""
	for _, dir := range []string{"./dist", "./frontend/dist", "../frontend/dist", "/app/dist", "/app/frontend/dist"} {
		if fi, err := os.Stat(dir); err == nil && fi.IsDir() {
			frontendDir = dir
			break
		}
	}

	if frontendDir != "" {
		log.Printf("Serving frontend application from %s", frontendDir)
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			// Never serve index.html for missing /api/ or /images/ endpoints
			if strings.HasPrefix(r.URL.Path, "/api/") || strings.HasPrefix(r.URL.Path, "/images/") {
				http.NotFound(w, r)
				return
			}

			cleanPath := filepath.Clean(r.URL.Path)
			filePath := filepath.Join(frontendDir, cleanPath)

			stat, err := os.Stat(filePath)
			if err == nil && !stat.IsDir() {
				// Static assets (like /assets/*.js or /assets/*.css) can be aggressively cached
				if strings.HasPrefix(cleanPath, "/assets/") {
					w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
				}
				http.ServeFile(w, r, filePath)
				return
			}

			// Single Page Application routing: serve index.html for all other page routes
			indexPath := filepath.Join(frontendDir, "index.html")
			if _, err := os.Stat(indexPath); err == nil {
				w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
				http.ServeFile(w, r, indexPath)
				return
			}

			http.NotFound(w, r)
		})
	} else {
		log.Println("Frontend build directory not found. Serving default status at root.")
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`{"shop_name":"VoltCraft Electrical & Lighting","status":"running","frontend":"dist directory not found"}`))
				return
			}
			http.NotFound(w, r)
		})
	}

	if cfg.AdminToken == "kadianga-admin-2026" {
		log.Println("[SECURITY WARNING] Server is using default development ADMIN_TOKEN (kadianga-admin-2026). In production, set a strong random ADMIN_TOKEN in your environment!")
	}

	// Global HTTP Middleware Pipeline: Recovery -> Security Headers -> CORS -> Global Rate Limiter -> Mux
	corsWrapped := middleware.CORSMiddleware(cfg.CORSAllow)(mux)
	rateLimited := middleware.RateLimitMiddleware(globalLimiter)(corsWrapped)
	secured := middleware.SecurityHeadersMiddleware()(rateLimited)
	finalHandler := middleware.RecoveryMiddleware()(secured)

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      finalHandler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown channel
	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("VoltCraft Backend running at http://localhost:%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	<-stopChan
	log.Println("Shutting down server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server shutdown failed: %v", err)
	}

	log.Println("Server gracefully stopped.")
}
