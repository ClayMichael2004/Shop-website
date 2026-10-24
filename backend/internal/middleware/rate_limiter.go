package middleware

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type clientVisitor struct {
	tokens     float64
	lastRefill time.Time
}

type IPRateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*clientVisitor
	rate     float64 // tokens per second
	capacity float64 // max tokens
}

func NewIPRateLimiter(ratePerMin float64, burst float64) *IPRateLimiter {
	limiter := &IPRateLimiter{
		visitors: make(map[string]*clientVisitor),
		rate:     ratePerMin / 60.0,
		capacity: burst,
	}
	go limiter.cleanup(10 * time.Minute)
	return limiter
}

func (l *IPRateLimiter) allow(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	v, exists := l.visitors[ip]
	if !exists {
		l.visitors[ip] = &clientVisitor{
			tokens:     l.capacity - 1,
			lastRefill: now,
		}
		return true
	}

	// Refill tokens based on elapsed time
	elapsed := now.Sub(v.lastRefill).Seconds()
	v.tokens += elapsed * l.rate
	if v.tokens > l.capacity {
		v.tokens = l.capacity
	}
	v.lastRefill = now

	if v.tokens >= 1.0 {
		v.tokens -= 1.0
		return true
	}

	return false
}

func (l *IPRateLimiter) cleanup(interval time.Duration) {
	ticker := time.NewTicker(interval)
	for range ticker.C {
		l.mu.Lock()
		cutoff := time.Now().Add(-15 * time.Minute)
		for ip, v := range l.visitors {
			if v.lastRefill.Before(cutoff) {
				delete(l.visitors, ip)
			}
		}
		l.mu.Unlock()
	}
}

func RateLimitMiddleware(limiter *IPRateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := extractIP(r)
			if !limiter.allow(ip) {
				http.Error(w, `{"error":"Too many requests. Please slow down.","status":429}`, http.StatusTooManyRequests)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func extractIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}

	// Only trust forwarding headers if the immediate peer is loopback / trusted proxy
	isTrustedProxy := host == "127.0.0.1" || host == "::1" || host == "localhost"

	if isTrustedProxy {
		forwarded := r.Header.Get("X-Forwarded-For")
		if forwarded != "" {
			parts := strings.Split(forwarded, ",")
			clientIP := strings.TrimSpace(parts[0])
			if net.ParseIP(clientIP) != nil {
				return clientIP
			}
		}
		realIP := strings.TrimSpace(r.Header.Get("X-Real-IP"))
		if realIP != "" && net.ParseIP(realIP) != nil {
			return realIP
		}
	}

	return host
}
