package cache

import (
	"sync"
	"time"
)

type item struct {
	value      interface{}
	expiration time.Time
}

type MemoryCache struct {
	mu    sync.RWMutex
	items map[string]item
}

func NewMemoryCache() *MemoryCache {
	c := &MemoryCache{
		items: make(map[string]item),
	}
	// Background garbage collection of expired items
	go c.janitor(5 * time.Minute)
	return c
}

func (c *MemoryCache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	it, found := c.items[key]
	if !found {
		return nil, false
	}
	if time.Now().After(it.expiration) {
		return nil, false
	}
	return it.value, true
}

func (c *MemoryCache) Set(key string, value interface{}, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = item{
		value:      value,
		expiration: time.Now().Add(ttl),
	}
}

func (c *MemoryCache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.items, key)
}

func (c *MemoryCache) FlushPrefix(prefix string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for k := range c.items {
		if len(k) >= len(prefix) && k[:len(prefix)] == prefix {
			delete(c.items, k)
		}
	}
}

func (c *MemoryCache) janitor(interval time.Duration) {
	ticker := time.NewTicker(interval)
	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for k, it := range c.items {
			if now.After(it.expiration) {
				delete(c.items, k)
			}
		}
		c.mu.Unlock()
	}
}
