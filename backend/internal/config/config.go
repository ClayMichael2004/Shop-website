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
	SMTPFrom     string
	CORSAllow    string
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

	return &Config{
		Port:         port,
		DBPath:       dbPath,
		ShopName:     shopName,
		ShopWhatsApp: shopWhatsApp,
		ShopEmail:    shopEmail,
		ShopAddress:  shopAddress,
		AdminToken:   adminToken,
		SMTPHost:     getEnv("SMTP_HOST", ""),
		SMTPPort:     getEnv("SMTP_PORT", "587"),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPass:     getEnv("SMTP_PASS", ""),
		SMTPFrom:     getEnv("SMTP_FROM", shopEmail),
		CORSAllow:    corsAllow,
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

