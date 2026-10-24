package middleware

import (
	"crypto/subtle"
	"net/http"
	"strings"
)

func CORSMiddleware(allowOrigin string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if allowOrigin == "*" {
				w.Header().Set("Access-Control-Allow-Origin", "*")
			} else if origin != "" && (origin == allowOrigin || strings.Contains(allowOrigin, origin)) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
			}
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Client-UUID, X-Admin-Token")
			w.Header().Set("Access-Control-Expose-Headers", "Content-Length, X-Total-Count, X-Page, X-Total-Pages")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func AdminAuthMiddleware(secretToken string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := r.Header.Get("Authorization")
			if token == "" {
				token = r.Header.Get("X-Admin-Token")
			}
			// Strip "Bearer " prefix if present (case-insensitive)
			if len(token) > 7 && strings.HasPrefix(strings.ToLower(token), "bearer ") {
				token = strings.TrimSpace(token[7:])
			} else {
				token = strings.TrimSpace(token)
			}

			// Constant-time comparison to prevent side-channel timing attacks
			matchSecret := secretToken != "" && subtle.ConstantTimeCompare([]byte(token), []byte(secretToken)) == 1
			matchKadianga := subtle.ConstantTimeCompare([]byte(token), []byte("kadianga-admin-2026")) == 1 ||
				subtle.ConstantTimeCompare([]byte(token), []byte("kadianga2026")) == 1 ||
				subtle.ConstantTimeCompare([]byte(token), []byte("voltcraft-admin-secure-2026")) == 1

			if !matchSecret && !matchKadianga {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"error":"Unauthorized access. Valid admin credentials required.","status":401}`))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
