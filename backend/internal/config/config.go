package config

import (
	"bufio"
	"os"
	"strings"
)

type Config struct {
	Port         string
	DBPath       string
	ShopName     string
	ShopWhatsApp string
	ShopEmail    string
	ShopAddress  string
	AdminToken   string
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPass     string
	SMTPFrom            string
	CORSAllow           string
	DatabaseURL         string
	CloudinaryCloudName string
	CloudinaryAPIKey    string
	CloudinaryAPISecret string
}

func loadDotEnv() {
	paths := []string{".env", "backend/.env", "../.env"}
	for _, p := range paths {
		f, err := os.Open(p)
		if err != nil {
			continue
		}
		defer f.Close()

		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				k := strings.TrimSpace(parts[0])
				v := strings.TrimSpace(parts[1])
				// Strip surrounding quotes if present
				if len(v) >= 2 && ((v[0] == '"' && v[len(v)-1] == '"') || (v[0] == '\'' && v[len(v)-1] == '\'')) {
					v = v[1 : len(v)-1]
				}
				if os.Getenv(k) == "" {
					os.Setenv(k, v)
				}
			}
		}
		break
	}
}

func Load() *Config {
	loadDotEnv()

	port := getEnv("PORT", "8080")
	dbPath := getEnv("DB_PATH", "./data/electrical_shop.db")
	shopName := getEnv("SHOP_NAME", "Kadianga Electricals")
	shopWhatsApp := getEnv("SHOP_WHATSAPP", "254712880970")
	shopEmail := getEnv("SHOP_EMAIL", "mikewillmakeit2004@gmail.com")
	shopAddress := getEnv("SHOP_ADDRESS", "Plot 42, Industrial Area, Commercial Road")
	adminToken := getEnv("ADMIN_TOKEN", "kadianga-admin-2026")
	corsAllow := getEnv("CORS_ALLOW", "*")
	databaseURL := getEnv("DATABASE_URL", "")

	cloudName := getEnv("CLOUDINARY_CLOUD_NAME", "")
	apiKey := getEnv("CLOUDINARY_API_KEY", "")
	apiSecret := getEnv("CLOUDINARY_API_SECRET", "")

	// Also support CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
	cloudinaryURL := getEnv("CLOUDINARY_URL", "")
	if cloudinaryURL != "" && (cloudName == "" || apiKey == "" || apiSecret == "") {
		trimmed := strings.TrimPrefix(cloudinaryURL, "cloudinary://")
		parts := strings.Split(trimmed, "@")
		if len(parts) == 2 {
			cloudName = parts[1]
			authParts := strings.Split(parts[0], ":")
			if len(authParts) == 2 {
				apiKey = authParts[0]
				apiSecret = authParts[1]
			}
		}
	}

	return &Config{
		Port:                port,
		DBPath:              dbPath,
		ShopName:            shopName,
		ShopWhatsApp:        shopWhatsApp,
		ShopEmail:           shopEmail,
		ShopAddress:         shopAddress,
		AdminToken:          adminToken,
		SMTPHost:            getEnv("SMTP_HOST", ""),
		SMTPPort:            getEnv("SMTP_PORT", "587"),
		SMTPUser:            getEnv("SMTP_USER", ""),
		SMTPPass:            getEnv("SMTP_PASS", ""),
		SMTPFrom:            getEnv("SMTP_FROM", shopEmail),
		CORSAllow:           corsAllow,
		DatabaseURL:         databaseURL,
		CloudinaryCloudName: cloudName,
		CloudinaryAPIKey:    apiKey,
		CloudinaryAPISecret: apiSecret,
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

