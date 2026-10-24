package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

type DB struct {
	*sql.DB
}

func InitDB(dbPath string) (*DB, error) {
	// Ensure directory exists
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create db directory: %w", err)
	}

	dsn := fmt.Sprintf("%s?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(ON)&_pragma=synchronous(NORMAL)", dbPath)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite db: %w", err)
	}

	// Optimize connection pool for concurrency
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(time.Hour)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping db: %w", err)
	}

	instance := &DB{db}
	if err := instance.migrate(); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	if err := instance.seedProductsIfEmpty(); err != nil {
		return nil, fmt.Errorf("failed to seed initial products: %w", err)
	}

	return instance, nil
}

func (db *DB) migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS products (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		sku TEXT NOT NULL UNIQUE,
		name TEXT NOT NULL,
		slug TEXT NOT NULL UNIQUE,
		category TEXT NOT NULL,
		subcategory TEXT NOT NULL,
		short_description TEXT NOT NULL,
		full_description TEXT NOT NULL,
		image_url TEXT NOT NULL,
		specs TEXT NOT NULL,
		in_stock BOOLEAN NOT NULL DEFAULT 1,
		base_estimate_price REAL NOT NULL DEFAULT 0.0,
		rating REAL NOT NULL DEFAULT 4.8,
		reviews_count INTEGER NOT NULL DEFAULT 12,
		featured BOOLEAN NOT NULL DEFAULT 0,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
	CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
	CREATE INDEX IF NOT EXISTS idx_products_instock ON products(in_stock);
	CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);

	CREATE TABLE IF NOT EXISTS quote_requests (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		quote_number TEXT NOT NULL UNIQUE,
		customer_name TEXT NOT NULL,
		customer_email TEXT NOT NULL,
		customer_phone TEXT NOT NULL,
		customer_location TEXT NOT NULL,
		notes TEXT,
		preferred_contact TEXT NOT NULL DEFAULT 'both',
		status TEXT NOT NULL DEFAULT 'pending',
		subtotal REAL NOT NULL DEFAULT 0.0,
		discount REAL NOT NULL DEFAULT 0.0,
		delivery_fee REAL NOT NULL DEFAULT 0.0,
		grand_total REAL NOT NULL DEFAULT 0.0,
		admin_notes TEXT,
		client_uuid TEXT,
		whatsapp_sent BOOLEAN NOT NULL DEFAULT 0,
		email_sent BOOLEAN NOT NULL DEFAULT 0,
		quoted_at DATETIME,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
	CREATE INDEX IF NOT EXISTS idx_quote_requests_email ON quote_requests(customer_email);
	CREATE INDEX IF NOT EXISTS idx_quote_requests_phone ON quote_requests(customer_phone);
	CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at DESC);
	CREATE INDEX IF NOT EXISTS idx_quote_requests_client_uuid ON quote_requests(client_uuid);

	CREATE TABLE IF NOT EXISTS quote_items (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		quote_id INTEGER NOT NULL,
		product_id INTEGER NOT NULL,
		product_name TEXT NOT NULL,
		product_sku TEXT NOT NULL,
		product_image TEXT NOT NULL,
		quantity INTEGER NOT NULL DEFAULT 1,
		quoted_unit_price REAL NOT NULL DEFAULT 0.0,
		quoted_total_price REAL NOT NULL DEFAULT 0.0,
		specs_notes TEXT,
		FOREIGN KEY (quote_id) REFERENCES quote_requests(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
	`

	_, err := db.Exec(schema)
	return err
}

func (db *DB) seedProductsIfEmpty() error {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM products").Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	seeds := []struct {
		sku, name, slug, category, subcategory, shortDesc, fullDesc, image, specs string
		price, rating                                                              float64
		reviews                                                                    int
		featured                                                                   bool
	}{
		{
			sku:         "CAB-ARM-4C16",
			name:        "4-Core Copper XLPE Armoured Underground Power Cable (16mm² - 95mm²)",
			slug:        "4-core-copper-armoured-cable",
			category:    "Armoured Cables",
			subcategory: "Low Voltage Power Distribution",
			shortDesc:   "High-grade multi-core copper armoured electrical cable with heavy PVC sheathing, designed for underground and rugged industrial installations.",
			fullDesc:    "Our multi-core armoured cables feature annealed high-conductivity electrolytic copper conductors insulated with cross-linked polyethylene (XLPE) and protected by high-tensile steel wire armouring (SWA). Waterproof, vermin-resistant, and flame-retardant outer sheath. Standard compliance: BS 5467 / IEC 60502-1. Ideal for mains underground feeds, substations, and industrial heavy equipment.",
			image:       "/images/armured cable.jpg",
			specs:       `{"Core Sizes Available": "16mm², 25mm², 35mm², 50mm², 70mm², 95mm²", "Voltage Rating": "600/1000V (0.6/1kV)", "Conductor": "Class 2 Stranded Plain Annealed Copper", "Insulation": "XLPE Cross-linked Polyethylene", "Armouring": "Galvanized Steel Wire Armour (SWA)", "Sheath": "Flame Retardant PVC (Black)", "Operating Temp": "-15°C to +90°C"}`,
			price:       2400.0,
			rating:      4.9,
			reviews:     38,
			featured:    true,
		},
		{
			sku:         "CAB-SNG-CON",
			name:        "Single Core Pure Copper Building Conduit Wire (1.5mm² - 10mm²)",
			slug:        "single-core-building-conduit-wire",
			category:    "Single Core Cables",
			subcategory: "Building Conduit Wires",
			shortDesc:   "Top-tier stranded copper residential and commercial single-core building wire available in red, yellow, blue, black, and earth green.",
			fullDesc:    "Premium grade 100% pure copper single-core wires designed for conduit installations, domestic wiring, trunking, and distribution boards. Excellent flexibility and superior insulation resistance preventing short circuits and thermal degradation. Certified to BS 6004 and KEBS/ISO standards. Delivered in standard 100m sealed rolls.",
			image:       "/images/single cable.jpg",
			specs:       `{"Available Gauges": "1.5mm², 2.5mm², 4.0mm², 6.0mm², 10.0mm²", "Roll Length": "100 Metres", "Colors Available": "Red (Live), Black (Neutral), Yellow, Blue, Green/Yellow (Earth)", "Voltage": "450/750V", "Insulation": "High Dielectric Lead-Free PVC", "Standards": "BS 6004 / IEC 60227"}`,
			price:       4100.0,
			rating:      4.8,
			reviews:     64,
			featured:    true,
		},
		{
			sku:         "CAB-TWN-SET",
			name:        "Twin & Earth Flat Power Cable + Workshop Electrical Installation Kit",
			slug:        "twin-earth-flat-cable-kit",
			category:    "Twin & Earth Cables",
			subcategory: "Surface & Concealed Wiring",
			shortDesc:   "Durable grey PVC twin & earth flat cable paired with breaker switchgear and installation accessories for domestic socket and lighting circuits.",
			fullDesc:    "Standard flat 2-core plus uninsulated circuit protective conductor (CPC) earth wire. Widely used for surface wiring and fixed installation in dry or damp premises. High thermal headroom with minimal voltage drop. Pack includes complimentary cable clips and terminal ferrules upon request.",
			image:       "/images/twin cable and others.jpg",
			specs:       `{"Core Sizes": "1.5mm² (Lighting), 2.5mm² (Ring Mains / Sockets)", "Roll Length": "100m Coils", "Conductors": "2 Stranded Copper + 1 Bare Earth", "Max Current": "27A (2.5mm²)", "Sheath Material": "Grey Self-Extinguishing PVC", "Certification": "BS 6004"}`,
			price:       5800.0,
			rating:      4.9,
			reviews:     42,
			featured:    true,
		},
		{
			sku:         "LGT-CHN-BRASS",
			name:        "Nordic Luxe Brushed Brass Pendant Chandelier (Cluster of 5 Drops)",
			slug:        "nordic-luxe-brushed-brass-pendant-chandelier",
			category:    "Chandeliers & Lighting",
			subcategory: "Luxury Ceiling Fixtures",
			shortDesc:   "Architectural brushed brass drop pendant chandelier with warm ambient glow, minimalist silhouettes, and adjustable suspension cables.",
			fullDesc:    "Handcrafted from solid spun aluminum with a multi-stage electroplated brushed brass finish. Designed for luxury dining spaces, double-volume living rooms, and hospitality lounges. Supports E27 warm Edison and filament LED bulbs with integrated flicker-free dimming driver compatibility. Ceiling canopy and mounting kit included.",
			image:       "/images/chandelier section.jpg",
			specs:       `{"Configuration": "5 Pendant Drop Cluster", "Finish": "Brushed Brass / Antique Gold", "Socket Type": "E27 / LED Warm 2700K - 3000K", "Cable Drop": "Adjustable up to 2.2 Metres", "Voltage": "110V - 240V AC", "Dimensions": "Canopy Ø 35cm, Shades Ø 24cm - 32cm"}`,
			price:       25000.0,
			rating:      5.0,
			reviews:     29,
			featured:    true,
		},
		{
			sku:         "SWG-MCB-3P63",
			name:        "Commercial 3-Phase MCB Miniature Circuit Breaker (63A 415V)",
			slug:        "3-phase-mcb-miniature-circuit-breaker-63a",
			category:    "Switchgear & Meters",
			subcategory: "Circuit Protection",
			shortDesc:   "Industrial grade triple pole circuit breaker with 10kA breaking capacity for factory motors, main distribution panels, and commercial meters.",
			fullDesc:    "High-reliability thermal-magnetic circuit breaker engineered to protect three-phase AC circuits against short circuit surges and continuous overload currents. Features bi-connect terminals, quick-snap DIN rail mounting, and visual trip status window.",
			image:       "/images/twin cable and others.jpg",
			specs:       `{"Rated Current": "63 Amps", "Poles": "3-Pole (3P)", "Breaking Capacity": "10 kA", "Tripping Curve": "Type C", "Mounting": "Standard 35mm DIN Rail", "Standards": "IEC/EN 60898-1"}`,
			price:       3600.0,
			rating:      4.8,
			reviews:     19,
			featured:    false,
		},
		{
			sku:         "MTR-SMART-DIN",
			name:        "Digital Single-Phase DIN-Rail Smart Energy KWh Meter",
			slug:        "digital-single-phase-kwh-meter",
			category:    "Switchgear & Meters",
			subcategory: "Sub-metering & Monitoring",
			shortDesc:   "High-precision backlit LCD digital electricity meter for tenant sub-metering, rental units, and energy management.",
			fullDesc:    "Class 1 accuracy solid-state active energy sub-meter. Measures real-time active power (W), cumulative kilowatt-hours (kWh), voltage (V), and amperage (A). Tamper-evident terminal cover sealable with standard utility wire ties.",
			image:       "/images/twin cable and others.jpg",
			specs:       `{"Current Range": "5(80)A", "Voltage": "230V AC ±20%", "Display": "7+1 Digits Backlit LCD", "Accuracy Class": "1.0", "Frequency": "50Hz / 60Hz", "Impulse Output": "1000 imp/kWh"}`,
			price:       3200.0,
			rating:      4.7,
			reviews:     23,
			featured:    false,
		},
		{
			sku:         "ACC-SCK-USB",
			name:        "13A Twin Switched Socket with Dual USB-C Fast Charger (Brushed Black)",
			slug:        "13a-twin-socket-dual-usb-c-brushed-black",
			category:    "Accessories & Sockets",
			subcategory: "Premium Wall Outlets",
			shortDesc:   "Screwless matte finish architectural dual wall outlet with integrated 20W USB-C Power Delivery and child safety shutter mechanism.",
			fullDesc:    "Upgrade your living or commercial space with modern flat-plate electrical outlets. Includes 2 independent 13A switch toggles and dual integrated USB-C smart charging ports capable of fast-charging smartphones and tablets without bulky power adapters.",
			image:       "/images/items section layout.jpg",
			specs:       `{"Current Rating": "13 Amp Double Gang", "USB Output": "USB-C + USB-A 5V 3.4A / 20W PD", "Faceplate": "Ultra-slim 4mm Matte Polycarbonate", "Safety": "Integrated 3-Pin Safety Shutter", "Backbox Depth": "Minimum 25mm", "Standard": "BS 1363-2"}`,
			price:       2100.0,
			rating:      4.9,
			reviews:     51,
			featured:    false,
		},
		{
			sku:         "ACC-DMR-LED",
			name:        "Universal Rotary LED Dimmer Switch (2-Way 250W Trailing Edge)",
			slug:        "universal-rotary-led-dimmer-switch",
			category:    "Accessories & Sockets",
			subcategory: "Lighting Controls",
			shortDesc:   "Smooth, flicker-free trailing-edge rotary dimmer optimized for dimmable LED chandeliers, spotlights, and ambient fixtures.",
			fullDesc:    "Equipped with advanced microcontroller technology that automatically senses load characteristics to eliminate LED humming, buzz, and low-end ghosting. Push-on/push-off control with adjustable minimum brightness trimmer on rear.",
			image:       "/images/items section layout.jpg",
			specs:       `{"Max Load": "250W LED / 400W Halogen", "Dimming Type": "Trailing Edge (Phase Cut)", "Way": "1-Way or 2-Way Switching", "Thermal Protection": "Automatic Overload Shutdown", "Knob Finish": "Brushed Metallic"}`,
			price:       2450.0,
			rating:      4.8,
			reviews:     31,
			featured:    false,
		},
	}

	stmt, err := db.Prepare(`
		INSERT INTO products (
			sku, name, slug, category, subcategory, short_description, full_description,
			image_url, specs, in_stock, base_estimate_price, rating, reviews_count, featured
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, s := range seeds {
		_, err := stmt.Exec(
			s.sku, s.name, s.slug, s.category, s.subcategory, s.shortDesc, s.fullDesc,
			s.image, s.specs, 1, s.price, s.rating, s.reviews, s.featured,
		)
		if err != nil {
			return err
		}
	}

	return nil
}
