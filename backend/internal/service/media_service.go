package service

import (
	"bytes"
	cryptorand "crypto/rand"
	"crypto/sha1"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"electrical-shop-backend/internal/config"
)

type MediaService struct {
	cfg *config.Config
}

func NewMediaService(cfg *config.Config) *MediaService {
	svc := &MediaService{cfg: cfg}
	if svc.IsCloudinaryEnabled() {
		log.Printf("Cloudinary media service enabled (Cloud: %s). Image uploads will stream to Cloudinary CDN.", cfg.CloudinaryCloudName)
	} else {
		log.Println("Cloudinary not configured. Image uploads will save to local disk (/assets).")
	}
	return svc
}

func (s *MediaService) IsCloudinaryEnabled() bool {
	return s.cfg.CloudinaryCloudName != "" && s.cfg.CloudinaryAPIKey != "" && s.cfg.CloudinaryAPISecret != ""
}

// UploadBytes uploads an image given raw bytes.
// If Cloudinary is configured, it uploads to Cloudinary and returns the secure CDN HTTPS URL.
// Otherwise, it falls back to saving locally on disk.
func (s *MediaService) UploadBytes(data []byte, filename, contentType string) (string, error) {
	if s.IsCloudinaryEnabled() {
		url, err := s.uploadToCloudinary(data, filename)
		if err == nil && url != "" {
			return url, nil
		}
		log.Printf("[MEDIA WARNING] Cloudinary upload failed (%v). Falling back to local storage.", err)
	}

	return s.saveLocalBytes(data, filename)
}

// UploadBase64 handles data:image/...;base64 payloads.
func (s *MediaService) UploadBase64(dataURL string) (string, error) {
	if s.IsCloudinaryEnabled() {
		// Cloudinary REST API accepts data URLs directly in the "file" field
		url, err := s.uploadDataURLToCloudinary(dataURL)
		if err == nil && url != "" {
			return url, nil
		}
		log.Printf("[MEDIA WARNING] Cloudinary base64 upload failed (%v). Falling back to local storage.", err)
	}

	parts := strings.SplitN(dataURL, ",", 2)
	if len(parts) != 2 {
		return "", fmt.Errorf("invalid base64 image data URL")
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

	detectedMime := http.DetectContentType(data)
	if !strings.HasPrefix(detectedMime, "image/") || detectedMime == "image/svg+xml" {
		return "", fmt.Errorf("decoded base64 content is not a supported raster image")
	}

	randomHex := make([]byte, 4)
	cryptorand.Read(randomHex)
	newFilename := fmt.Sprintf("prod_%d_%x%s", time.Now().Unix(), randomHex, ext)

	return s.saveLocalBytes(data, newFilename)
}

func (s *MediaService) uploadToCloudinary(data []byte, filename string) (string, error) {
	timestamp := fmt.Sprintf("%d", time.Now().Unix())

	// Cloudinary signature = SHA1("timestamp=" + timestamp + apiSecret)
	sigPayload := fmt.Sprintf("timestamp=%s%s", timestamp, s.cfg.CloudinaryAPISecret)
	hasher := sha1.New()
	hasher.Write([]byte(sigPayload))
	signature := hex.EncodeToString(hasher.Sum(nil))

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	_ = writer.WriteField("api_key", s.cfg.CloudinaryAPIKey)
	_ = writer.WriteField("timestamp", timestamp)
	_ = writer.WriteField("signature", signature)

	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", err
	}
	if _, err := part.Write(data); err != nil {
		return "", err
	}
	_ = writer.Close()

	endpoint := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", s.cfg.CloudinaryCloudName)
	req, err := http.NewRequest(http.MethodPost, endpoint, &body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("cloudinary http request error: %w", err)
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	var result struct {
		SecureURL string `json:"secure_url"`
		URL       string `json:"url"`
		Error     *struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(respBytes, &result); err != nil {
		return "", fmt.Errorf("failed to parse cloudinary response: %s", string(respBytes))
	}

	if result.Error != nil && result.Error.Message != "" {
		return "", fmt.Errorf("cloudinary error: %s", result.Error.Message)
	}

	if result.SecureURL != "" {
		return result.SecureURL, nil
	}
	if result.URL != "" {
		return result.URL, nil
	}

	return "", fmt.Errorf("cloudinary returned empty URL: %s", string(respBytes))
}

func (s *MediaService) uploadDataURLToCloudinary(dataURL string) (string, error) {
	timestamp := fmt.Sprintf("%d", time.Now().Unix())

	sigPayload := fmt.Sprintf("timestamp=%s%s", timestamp, s.cfg.CloudinaryAPISecret)
	hasher := sha1.New()
	hasher.Write([]byte(sigPayload))
	signature := hex.EncodeToString(hasher.Sum(nil))

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	_ = writer.WriteField("api_key", s.cfg.CloudinaryAPIKey)
	_ = writer.WriteField("timestamp", timestamp)
	_ = writer.WriteField("signature", signature)
	_ = writer.WriteField("file", dataURL)
	_ = writer.Close()

	endpoint := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", s.cfg.CloudinaryCloudName)
	req, err := http.NewRequest(http.MethodPost, endpoint, &body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("cloudinary http request error: %w", err)
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	var result struct {
		SecureURL string `json:"secure_url"`
		URL       string `json:"url"`
		Error     *struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(respBytes, &result); err != nil {
		return "", fmt.Errorf("failed to parse cloudinary response: %s", string(respBytes))
	}

	if result.Error != nil && result.Error.Message != "" {
		return "", fmt.Errorf("cloudinary error: %s", result.Error.Message)
	}

	if result.SecureURL != "" {
		return result.SecureURL, nil
	}
	if result.URL != "" {
		return result.URL, nil
	}

	return "", fmt.Errorf("cloudinary returned empty URL: %s", string(respBytes))
}

func (s *MediaService) saveLocalBytes(data []byte, filename string) (string, error) {
	targetDirs := []string{
		"./assets",
		"../assets",
		"/assets",
		"/app/assets",
		"./frontend/public/images",
		"../frontend/public/images",
		"./frontend/dist/images",
		"../frontend/dist/images",
	}

	saved := false
	for _, dir := range targetDirs {
		if fi, err := os.Stat(dir); err == nil && fi.IsDir() {
			dstPath := filepath.Join(dir, filename)
			if err := os.WriteFile(dstPath, data, 0644); err == nil {
				saved = true
			}
		}
	}

	if !saved {
		_ = os.MkdirAll("./assets", 0755)
		if err := os.WriteFile(filepath.Join("./assets", filename), data, 0644); err != nil {
			return "", err
		}
	}

	return "/images/" + filename, nil
}
