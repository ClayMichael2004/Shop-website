package cache

import (
	"testing"
	"time"
)

func TestMemoryCache_SetAndGet(t *testing.T) {
	c := NewMemoryCache()

	c.Set("test-key", "hello-world", 100*time.Millisecond)

	val, found := c.Get("test-key")
	if !found {
		t.Fatalf("expected to find key in cache")
	}
	if val.(string) != "hello-world" {
		t.Fatalf("expected hello-world, got %v", val)
	}

	// Wait for expiration
	time.Sleep(150 * time.Millisecond)
	_, found = c.Get("test-key")
	if found {
		t.Fatalf("expected key to expire")
	}
}

func TestMemoryCache_FlushPrefix(t *testing.T) {
	c := NewMemoryCache()

	c.Set("products:1", "item1", time.Minute)
	c.Set("products:2", "item2", time.Minute)
	c.Set("users:1", "user1", time.Minute)

	c.FlushPrefix("products:")

	if _, found := c.Get("products:1"); found {
		t.Fatalf("expected products:1 to be flushed")
	}
	if _, found := c.Get("users:1"); !found {
		t.Fatalf("expected users:1 to remain")
	}
}
