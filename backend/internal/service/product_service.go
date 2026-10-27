package service

import (
	"database/sql"
	"fmt"
	"math"
	"strings"
	"time"

	"electrical-shop-backend/internal/cache"
	"electrical-shop-backend/internal/database"
	"electrical-shop-backend/internal/models"
)

type ProductService struct {
	db    *database.DB
	cache *cache.MemoryCache
}

func NewProductService(db *database.DB, c *cache.MemoryCache) *ProductService {
	return &ProductService{
		db:    db,
		cache: c,
	}
}

type ProductListResult struct {
	Products   []models.Product `json:"products"`
	Total      int              `json:"total"`
	Page       int              `json:"page"`
	Limit      int              `json:"limit"`
	TotalPages int              `json:"total_pages"`
}

func (s *ProductService) ListProducts(category string, search string, page int, limit int, sort string) (*ProductListResult, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 12
	}
	offset := (page - 1) * limit

	cacheKey := fmt.Sprintf("products:cat=%s:s=%s:p=%d:l=%d:sort=%s", category, search, page, limit, sort)
	if val, ok := s.cache.Get(cacheKey); ok {
		if res, ok := val.(*ProductListResult); ok {
			return res, nil
		}
	}

	whereClauses := []string{"1=1"}
	var args []interface{}

	if category != "" && strings.ToLower(category) != "all" {
		whereClauses = append(whereClauses, "category = ?")
		args = append(args, category)
	}

	if search != "" {
		whereClauses = append(whereClauses, "(name LIKE ? OR short_description LIKE ? OR subcategory LIKE ? OR sku LIKE ?)")
		pattern := "%" + search + "%"
		args = append(args, pattern, pattern, pattern, pattern)
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	// Count query using indexed filters
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM products WHERE %s", whereSQL)
	err := s.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count products: %w", err)
	}

	// Order by
	orderBy := "featured DESC, id ASC"
	switch sort {
	case "price_asc":
		orderBy = "base_estimate_price ASC"
	case "price_desc":
		orderBy = "base_estimate_price DESC"
	case "name_asc":
		orderBy = "name ASC"
	case "rating":
		orderBy = "rating DESC"
	case "newest":
		orderBy = "created_at DESC"
	}

	query := fmt.Sprintf(`
		SELECT id, sku, name, slug, category, subcategory, short_description, full_description,
		       image_url, specs, in_stock, base_estimate_price, rating, reviews_count, featured,
		       created_at, updated_at
		FROM products
		WHERE %s
		ORDER BY %s
		LIMIT ? OFFSET ?
	`, whereSQL, orderBy)

	queryArgs := append(args, limit, offset)
	rows, err := s.db.Query(query, queryArgs...)
	if err != nil {
		return nil, fmt.Errorf("failed to query products: %w", err)
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		err := rows.Scan(
			&p.ID, &p.SKU, &p.Name, &p.Slug, &p.Category, &p.Subcategory,
			&p.ShortDesc, &p.FullDesc, &p.ImageURL, &p.Specs, &p.InStock,
			&p.BaseEstimatePrice, &p.Rating, &p.ReviewsCount, &p.Featured,
			&p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan product: %w", err)
		}
		products = append(products, p)
	}

	if products == nil {
		products = []models.Product{}
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	result := &ProductListResult{
		Products:   products,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}

	s.cache.Set(cacheKey, result, 2*time.Minute)
	return result, nil
}

func (s *ProductService) GetProductByID(id int64) (*models.Product, error) {
	cacheKey := fmt.Sprintf("product:id:%d", id)
	if val, ok := s.cache.Get(cacheKey); ok {
		if p, ok := val.(*models.Product); ok {
			return p, nil
		}
	}

	var p models.Product
	query := `
		SELECT id, sku, name, slug, category, subcategory, short_description, full_description,
		       image_url, specs, in_stock, base_estimate_price, rating, reviews_count, featured,
		       created_at, updated_at
		FROM products
		WHERE id = ?
	`
	err := s.db.QueryRow(query, id).Scan(
		&p.ID, &p.SKU, &p.Name, &p.Slug, &p.Category, &p.Subcategory,
		&p.ShortDesc, &p.FullDesc, &p.ImageURL, &p.Specs, &p.InStock,
		&p.BaseEstimatePrice, &p.Rating, &p.ReviewsCount, &p.Featured,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	s.cache.Set(cacheKey, &p, 10*time.Minute)
	return &p, nil
}

func (s *ProductService) CreateProduct(p *models.Product) (int64, error) {
	s.cache.FlushPrefix("products:")

	query := `
		INSERT INTO products (
			sku, name, slug, category, subcategory, short_description, full_description,
			image_url, specs, in_stock, base_estimate_price, rating, reviews_count, featured,
			created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id
	`
	var id int64
	err := s.db.QueryRow(query,
		p.SKU, p.Name, p.Slug, p.Category, p.Subcategory, p.ShortDesc, p.FullDesc,
		p.ImageURL, p.Specs, p.InStock, p.BaseEstimatePrice, p.Rating, p.ReviewsCount, p.Featured,
	).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (s *ProductService) UpdateProduct(id int64, p *models.Product) error {
	s.cache.FlushPrefix("products:")
	s.cache.Delete(fmt.Sprintf("product:id:%d", id))

	query := `
		UPDATE products
		SET sku = ?, name = ?, slug = ?, category = ?, subcategory = ?, short_description = ?,
		    full_description = ?, image_url = ?, specs = ?, in_stock = ?, base_estimate_price = ?,
		    featured = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`
	_, err := s.db.Exec(query,
		p.SKU, p.Name, p.Slug, p.Category, p.Subcategory, p.ShortDesc, p.FullDesc,
		p.ImageURL, p.Specs, p.InStock, p.BaseEstimatePrice, p.Featured, id,
	)
	return err
}

func (s *ProductService) DeleteProduct(id int64) error {
	s.cache.FlushPrefix("products:")
	s.cache.Delete(fmt.Sprintf("product:id:%d", id))

	_, err := s.db.Exec("DELETE FROM products WHERE id = ?", id)
	return err
}

func (s *ProductService) ListCategories() ([]map[string]interface{}, error) {
	rows, err := s.db.Query(`
		SELECT category, COUNT(*) as count
		FROM products
		GROUP BY category
		ORDER BY count DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []map[string]interface{}
	for rows.Next() {
		var cat string
		var cnt int
		if err := rows.Scan(&cat, &cnt); err == nil {
			list = append(list, map[string]interface{}{
				"name":  cat,
				"count": cnt,
			})
		}
	}
	return list, nil
}
