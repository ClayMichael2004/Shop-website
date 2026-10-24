package middleware

import (
	"log"
	"net/http"
	"runtime/debug"
)

// SecurityHeadersMiddleware injects standard defense-in-depth HTTP headers.
func SecurityHeadersMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("X-Frame-Options", "SAMEORIGIN")
			w.Header().Set("X-XSS-Protection", "0")
			w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
			w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
			w.Header().Set("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' https: data:; connect-src 'self';")

			next.ServeHTTP(w, r)
		})
	}
}

// RecoveryMiddleware catches any unhandled panics, logs stack securely, and avoids crashing the server.
func RecoveryMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					log.Printf("[PANIC RECOVERED] Endpoint %s %s: %v\nStack:\n%s", r.Method, r.URL.Path, err, debug.Stack())
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusInternalServerError)
					w.Write([]byte(`{"error":"An unexpected internal server error occurred.","status":500}`))
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}

// MaxBodyBytesMiddleware restricts the maximum body size read from clients to prevent memory exhaustion DoS.
func MaxBodyBytesMiddleware(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Body != nil {
				r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			}
			next.ServeHTTP(w, r)
		})
	}
}
