package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSecurityHeadersMiddleware(t *testing.T) {
	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	mw := SecurityHeadersMiddleware()(dummyHandler)
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rr := httptest.NewRecorder()

	mw.ServeHTTP(rr, req)

	if val := rr.Header().Get("X-Content-Type-Options"); val != "nosniff" {
		t.Errorf("expected X-Content-Type-Options nosniff, got %q", val)
	}
	if val := rr.Header().Get("X-Frame-Options"); val != "SAMEORIGIN" {
		t.Errorf("expected X-Frame-Options SAMEORIGIN, got %q", val)
	}
	if val := rr.Header().Get("X-XSS-Protection"); val != "0" {
		t.Errorf("expected X-XSS-Protection 0, got %q", val)
	}
	if val := rr.Header().Get("Referrer-Policy"); val != "strict-origin-when-cross-origin" {
		t.Errorf("expected Referrer-Policy strict-origin-when-cross-origin, got %q", val)
	}
	if val := rr.Header().Get("Content-Security-Policy"); val == "" {
		t.Errorf("expected Content-Security-Policy header, got empty")
	}
	if val := rr.Header().Get("Strict-Transport-Security"); val == "" {
		t.Errorf("expected Strict-Transport-Security header, got empty")
	}
}

func TestRecoveryMiddleware(t *testing.T) {
	panicHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("critical simulated server runtime failure")
	})

	mw := RecoveryMiddleware()(panicHandler)
	req := httptest.NewRequest(http.MethodGet, "/panic", nil)
	rr := httptest.NewRecorder()

	mw.ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500 on panic recovery, got %d", rr.Code)
	}
}

func TestAdminAuthMiddleware_Security(t *testing.T) {
	secret := "production-super-secret-key-987"
	protectedHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("admin-access-granted"))
	})

	authMw := AdminAuthMiddleware(secret)(protectedHandler)

	// Case 1: Valid Authorization Bearer header
	req1 := httptest.NewRequest(http.MethodGet, "/api/admin/stats", nil)
	req1.Header.Set("Authorization", "Bearer "+secret)
	rr1 := httptest.NewRecorder()
	authMw.ServeHTTP(rr1, req1)
	if rr1.Code != http.StatusOK {
		t.Fatalf("expected status 200 for valid Bearer token, got %d", rr1.Code)
	}

	// Case 2: Valid X-Admin-Token header
	req2 := httptest.NewRequest(http.MethodGet, "/api/admin/stats", nil)
	req2.Header.Set("X-Admin-Token", secret)
	rr2 := httptest.NewRecorder()
	authMw.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusOK {
		t.Fatalf("expected status 200 for valid X-Admin-Token, got %d", rr2.Code)
	}

	// Case 3: Invalid token
	req3 := httptest.NewRequest(http.MethodGet, "/api/admin/stats", nil)
	req3.Header.Set("Authorization", "Bearer invalid-guess")
	rr3 := httptest.NewRecorder()
	authMw.ServeHTTP(rr3, req3)
	if rr3.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401 for invalid token, got %d", rr3.Code)
	}

	// Case 4: Query parameter token rejection (disallowed for URL logging protection)
	req4 := httptest.NewRequest(http.MethodGet, "/api/admin/stats?token="+secret, nil)
	rr4 := httptest.NewRecorder()
	authMw.ServeHTTP(rr4, req4)
	if rr4.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401 for token in query parameter, got %d", rr4.Code)
	}

	// Case 5: Default dev token must be rejected when custom secret is set (Backdoor defense)
	req5 := httptest.NewRequest(http.MethodGet, "/api/admin/stats", nil)
	req5.Header.Set("Authorization", "Bearer kadianga-admin-2026")
	rr5 := httptest.NewRecorder()
	authMw.ServeHTTP(rr5, req5)
	if rr5.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401 for dev fallback token when custom production secret is set, got %d", rr5.Code)
	}
}

func TestRateLimiter_ExtractIP_SpoofDefense(t *testing.T) {
	// Untrusted external client trying to spoof X-Forwarded-For
	req := httptest.NewRequest(http.MethodPost, "/api/quotes", nil)
	req.RemoteAddr = "203.0.113.195:48392" // External public IP
	req.Header.Set("X-Forwarded-For", "198.51.100.22")

	ip := extractIP(req)
	if ip != "203.0.113.195" {
		t.Fatalf("expected extractIP to ignore spoofed X-Forwarded-For from external peer, got %s", ip)
	}

	// Trusted local reverse proxy peer
	reqLocal := httptest.NewRequest(http.MethodPost, "/api/quotes", nil)
	reqLocal.RemoteAddr = "127.0.0.1:51234"
	reqLocal.Header.Set("X-Forwarded-For", "198.51.100.22")

	ipLocal := extractIP(reqLocal)
	if ipLocal != "198.51.100.22" {
		t.Fatalf("expected extractIP to respect X-Forwarded-For from trusted local proxy, got %s", ipLocal)
	}
}

func TestAdminRateLimiter_BruteForceProtection(t *testing.T) {
	limiter := NewIPRateLimiter(6, 3) // 3 burst allowed
	handler := RateLimitMiddleware(limiter)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	}))

	for i := 0; i < 3; i++ {
		req := httptest.NewRequest(http.MethodGet, "/api/admin/verify", nil)
		req.RemoteAddr = "192.0.2.10:12345"
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected call %d to succeed within burst limit, got %d", i+1, rr.Code)
		}
	}

	// 4th rapid attempt must be rejected with 429
	req := httptest.NewRequest(http.MethodGet, "/api/admin/verify", nil)
	req.RemoteAddr = "192.0.2.10:12345"
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	if rr.Code != http.StatusTooManyRequests {
		t.Fatalf("expected call 4 to be rejected with 429 Too Many Requests, got %d", rr.Code)
	}
}
