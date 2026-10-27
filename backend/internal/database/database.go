package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	_ "github.com/lib/pq"
	_ "modernc.org/sqlite"
)

type DB struct {
	*sql.DB
	Dialect string // "postgres" or "sqlite"
}

type Tx struct {
	*sql.Tx
	Dialect string
}

func (db *DB) Rebind(query string) string {
	if db.Dialect != "postgres" {
		return query
	}
	return rebindPostgres(query)
}

func (tx *Tx) Rebind(query string) string {
	if tx.Dialect != "postgres" {
		return query
	}
	return rebindPostgres(query)
}

func rebindPostgres(query string) string {
	var b strings.Builder
	b.Grow(len(query) + 16)
	paramIndex := 1
	inSingleQuote := false

	for i := 0; i < len(query); i++ {
		c := query[i]
		if c == '\'' {
			inSingleQuote = !inSingleQuote
			b.WriteByte(c)
			continue
		}

		if c == '?' && !inSingleQuote {
			b.WriteByte('$')
			b.WriteString(strconv.Itoa(paramIndex))
			paramIndex++
		} else {
			b.WriteByte(c)
		}
	}

	result := b.String()
	result = strings.ReplaceAll(result, " LIKE ", " ILIKE ")
	return result
}

func (db *DB) Exec(query string, args ...any) (sql.Result, error) {
	return db.DB.Exec(db.Rebind(query), args...)
}

func (db *DB) Query(query string, args ...any) (*sql.Rows, error) {
	return db.DB.Query(db.Rebind(query), args...)
}

func (db *DB) QueryRow(query string, args ...any) *sql.Row {
	return db.DB.QueryRow(db.Rebind(query), args...)
}

func (db *DB) Prepare(query string) (*sql.Stmt, error) {
	return db.DB.Prepare(db.Rebind(query))
}

func (db *DB) Begin() (*Tx, error) {
	tx, err := db.DB.Begin()
	if err != nil {
		return nil, err
	}
	return &Tx{Tx: tx, Dialect: db.Dialect}, nil
}

func (tx *Tx) Exec(query string, args ...any) (sql.Result, error) {
	return tx.Tx.Exec(tx.Rebind(query), args...)
}

func (tx *Tx) Query(query string, args ...any) (*sql.Rows, error) {
	return tx.Tx.Query(tx.Rebind(query), args...)
}

func (tx *Tx) QueryRow(query string, args ...any) *sql.Row {
	return tx.Tx.QueryRow(tx.Rebind(query), args...)
}

func (tx *Tx) Prepare(query string) (*sql.Stmt, error) {
	return tx.Tx.Prepare(tx.Rebind(query))
}

func InitDB(databaseURL, dbPath string) (*DB, error) {
	if strings.HasPrefix(databaseURL, "postgres://") || strings.HasPrefix(databaseURL, "postgresql://") {
		return initPostgres(databaseURL)
	}
	return initSQLite(dbPath)
}

func initPostgres(connStr string) (*DB, error) {
	log.Println("Connecting to Cloud PostgreSQL database...")
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open postgres db: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(time.Hour)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping postgres db: %w", err)
	}
	log.Println("Successfully connected to Cloud PostgreSQL database.")

	instance := &DB{DB: db, Dialect: "postgres"}
	if err := instance.migrate(); err != nil {
		return nil, fmt.Errorf("failed to run postgres migrations: %w", err)
	}

	if err := instance.seedProductsIfEmpty(); err != nil {
		return nil, fmt.Errorf("failed to seed initial products in postgres: %w", err)
	}

	return instance, nil
}

func initSQLite(dbPath string) (*DB, error) {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create db directory: %w", err)
	}

	dsn := fmt.Sprintf("%s?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(ON)&_pragma=synchronous(NORMAL)", dbPath)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite db: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(time.Hour)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping sqlite db: %w", err)
	}
	log.Printf("Connected to local SQLite database at %s.", dbPath)

	instance := &DB{DB: db, Dialect: "sqlite"}
	if err := instance.migrate(); err != nil {
		return nil, fmt.Errorf("failed to run sqlite migrations: %w", err)
	}

	if err := instance.seedProductsIfEmpty(); err != nil {
		return nil, fmt.Errorf("failed to seed initial products in sqlite: %w", err)
	}

	return instance, nil
}

func (db *DB) migrate() error {
	var schema string
	if db.Dialect == "postgres" {
		schema = `
		CREATE TABLE IF NOT EXISTS products (
			id SERIAL PRIMARY KEY,
			sku TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL,
			slug TEXT NOT NULL UNIQUE,
			category TEXT NOT NULL,
			subcategory TEXT NOT NULL,
			short_description TEXT NOT NULL,
			full_description TEXT NOT NULL,
			image_url TEXT NOT NULL,
			specs TEXT NOT NULL,
			in_stock BOOLEAN NOT NULL DEFAULT TRUE,
			base_estimate_price DOUBLE PRECISION NOT NULL DEFAULT 0.0,
			rating DOUBLE PRECISION NOT NULL DEFAULT 4.8,
			reviews_count INTEGER NOT NULL DEFAULT 12,
			featured BOOLEAN NOT NULL DEFAULT FALSE,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
		CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
		CREATE INDEX IF NOT EXISTS idx_products_instock ON products(in_stock);
		CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);

		CREATE TABLE IF NOT EXISTS quote_requests (
			id SERIAL PRIMARY KEY,
			quote_number TEXT NOT NULL UNIQUE,
			customer_name TEXT NOT NULL,
			customer_email TEXT NOT NULL,
			customer_phone TEXT NOT NULL,
			customer_location TEXT NOT NULL,
			notes TEXT,
			preferred_contact TEXT NOT NULL DEFAULT 'both',
			status TEXT NOT NULL DEFAULT 'pending',
			subtotal DOUBLE PRECISION NOT NULL DEFAULT 0.0,
			discount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
			delivery_fee DOUBLE PRECISION NOT NULL DEFAULT 0.0,
			grand_total DOUBLE PRECISION NOT NULL DEFAULT 0.0,
			admin_notes TEXT,
			client_uuid TEXT,
			whatsapp_sent BOOLEAN NOT NULL DEFAULT FALSE,
			email_sent BOOLEAN NOT NULL DEFAULT FALSE,
			quoted_at TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
		CREATE INDEX IF NOT EXISTS idx_quote_requests_email ON quote_requests(customer_email);
		CREATE INDEX IF NOT EXISTS idx_quote_requests_phone ON quote_requests(customer_phone);
		CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at DESC);
		CREATE INDEX IF NOT EXISTS idx_quote_requests_client_uuid ON quote_requests(client_uuid);

		CREATE TABLE IF NOT EXISTS quote_items (
			id SERIAL PRIMARY KEY,
			quote_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
			product_id INTEGER NOT NULL,
			product_name TEXT NOT NULL,
			product_sku TEXT NOT NULL,
			product_image TEXT NOT NULL,
			quantity INTEGER NOT NULL DEFAULT 1,
			quoted_unit_price DOUBLE PRECISION NOT NULL DEFAULT 0.0,
			quoted_total_price DOUBLE PRECISION NOT NULL DEFAULT 0.0,
			specs_notes TEXT
		);

		CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
		`
	} else {
		schema = `
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
	}

	_, err := db.DB.Exec(schema)
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
		{
			sku:         "FIT-SWT-2G2W",
			name:        "Schneider Style 2-Gang 2-Way Flush Rocker Light Switch (Matt White)",
			slug:        "schneider-style-2gang-2way-light-switch",
			category:    "Electrical Fittings",
			subcategory: "Wall Switches & Faceplates",
			shortDesc:   "High-durability 16AX 2-gang 2-way modular rocker wall switch with flame-retardant polycarbonate housing.",
			fullDesc:    "Engineered for reliable domestic and commercial lighting control. Features silver alloy contact points, smooth tactile switching action, and antibacterial scratch-resistant surface finish. Standard 86x86mm flush mounting.",
			image:       "/images/items section layout.jpg",
			specs:       `{"Gang": "2-Gang", "Way": "2-Way Switching", "Rating": "16AX 250V AC", "Material": "UV-Stabilized Flame-Retardant Polycarbonate", "Standard": "IEC 60669-1"}`,
			price:       1250.0,
			rating:      4.9,
			reviews:     44,
			featured:    false,
		},
		{
			sku:         "FIT-JNC-IP66",
			name:        "IP66 Waterproof Exterior Adaptable Junction Box with M20 Glands",
			slug:        "ip66-waterproof-exterior-junction-box",
			category:    "Electrical Fittings",
			subcategory: "Conduit & Junction Fittings",
			shortDesc:   "Weatherproof and dust-tight heavy PVC junction box with rubber gasket seals and multi-directional cable knockout entries.",
			fullDesc:    "Designed for outdoor security lighting, perimeter wiring, and industrial conduit branches. Includes captive stainless steel screws and silicone sealing gasket for dependable IP66 ingress protection.",
			image:       "/images/twin cable and others.jpg",
			specs:       `{"Dimensions": "150 x 110 x 70 mm", "Protection": "IP66 Dust & Water Jet Proof", "Entries": "10 Knockout Gland Ports (M20)", "Material": "High Impact ABS"}`,
			price:       950.0,
			rating:      4.8,
			reviews:     28,
			featured:    false,
		},
		{
			sku:         "ELC-AVR-5KVA",
			name:        "Digital Heavy-Duty Automatic Voltage Regulator (AVR / Stabilizer 5000VA)",
			slug:        "digital-avr-voltage-stabilizer-5000va",
			category:    "Electronics & Appliances",
			subcategory: "Voltage Stabilizers & Regulators",
			shortDesc:   "Microprocessor-controlled servo motor voltage stabilizer protecting sensitive electronics, compressors, and pumps against brownouts and power surges.",
			fullDesc:    "Reliable voltage regulation for home, office, and light industrial equipment. Wide input voltage tolerance (130V - 260V AC) delivering stable 230V output. Dual digital meter displays real-time input and output voltages.",
			image:       "/images/power.jpg",
			specs:       `{"Capacity": "5000VA / 5kVA", "Input Range": "130V - 260V AC", "Output Voltage": "230V AC ±2%", "Display": "Dual Digital LED", "Protection": "High/Low Voltage, Overload & Delay"}`,
			price:       19500.0,
			rating:      4.9,
			reviews:     36,
			featured:    true,
		},
		{
			sku:         "ELC-EXT-SURG",
			name:        "Industrial 4-Way Heavy Duty Surge Protected Extension Cable Reel (25 Metres)",
			slug:        "industrial-heavy-duty-extension-reel-25m",
			category:    "Electronics & Appliances",
			subcategory: "Extensions & Surge Protection",
			shortDesc:   "Rugged steel framed portable cable extension drum reel with thermal overload circuit breaker and 4 shuttered 13A safety sockets.",
			fullDesc:    "Contractor grade extension reel equipped with 25 metres of 3-core 1.5mm² flexible heavy duty PVC cable. Built-in thermal cutout switch prevents dangerous overheating during heavy continuous power tool operation.",
			image:       "/images/armured cable.jpg",
			specs:       `{"Cable Length": "25 Metres", "Cable Type": "3-Core 1.5mm² Heavy Duty", "Sockets": "4x 13A Shuttered Outlets", "Safety": "Thermal Cutout Reset Switch", "Max Load": "3120W Fully Uncoiled"}`,
			price:       6800.0,
			rating:      4.8,
			reviews:     21,
			featured:    false,
		},
		{
			sku:         "SOL-PNL-550W",
			name:        "Tier-1 Monocrystalline Half-Cell High Efficiency Solar Panel (550W)",
			slug:        "tier-1-monocrystalline-solar-panel-550w",
			category:    "Solar Systems & Accessories",
			subcategory: "Solar PV Panels",
			shortDesc:   "Ultra-high efficiency monocrystalline PERC half-cut solar PV module engineered for rooftop residential and off-grid contractor installations.",
			fullDesc:    "Delivers maximum kilowatt output even in low ambient light or high temperature conditions. Features multi-busbar technology for reduced resistance losses, anti-reflective tempered glass, and anodized aluminum frame.",
			image:       "/images/herosection.webp",
			specs:       `{"Peak Power (Pmax)": "550W", "Efficiency": "21.3%", "Cell Type": "Monocrystalline Half-Cut PERC", "Frame": "Anodized Corrosion-Resistant Aluminum", "Warranty": "25 Years Linear Power Output"}`,
			price:       17500.0,
			rating:      5.0,
			reviews:     53,
			featured:    true,
		},
		{
			sku:         "SOL-INV-5KW",
			name:        "Hybrid Pure Sine Wave Solar Inverter with 80A MPPT Controller (5kW / 48V)",
			slug:        "hybrid-pure-sine-wave-solar-inverter-5kw",
			category:    "Solar Systems & Accessories",
			subcategory: "Inverters & Storage",
			shortDesc:   "Smart multifunctional hybrid power inverter combining MPPT solar charger, pure sine wave inverter, and AC battery charger with LCD status screen.",
			fullDesc:    "Seamless automatic changeover between solar power, lithium/gel battery backup, and utility grid power. High surge capacity for starting refrigerators, water pumps, and air conditioning units.",
			image:       "/images/power.jpg",
			specs:       `{"Rated Power": "5000VA / 5000W", "Battery Voltage": "48V DC", "MPPT Range": "120V - 450V DC", "Max Solar Input": "5000W", "Waveform": "Pure Sine Wave"}`,
			price:       85000.0,
			rating:      4.9,
			reviews:     19,
			featured:    false,
		},
		{
			sku:         "SOL-FLD-200W",
			name:        "All-in-One Solar LED Security Floodlight with PIR Motion Sensor (200W IP67)",
			slug:        "solar-led-security-floodlight-200w",
			category:    "Solar Systems & Accessories",
			subcategory: "Solar Outdoor Lighting",
			shortDesc:   "Zero-electricity outdoor commercial solar floodlight with integrated high-capacity lithium iron phosphate (LiFePO4) battery and wireless remote.",
			fullDesc:    "Heavy-duty die-cast aluminum solar luminaire providing ultra-wide beam perimeter security illumination. Dusk-to-dawn automatic intelligent sensor controller keeps perimeter well lit through rainy nights.",
			image:       "/images/chandelier section.jpg",
			specs:       `{"Power": "200W High Lumen LED", "Battery": "3.2V 25Ah LiFePO4", "Lighting Time": "12-16 Hours Continuous", "Waterproof Rating": "IP67", "Control": "Auto Dusk-to-Dawn + Infrared Remote"}`,
			price:       5200.0,
			rating:      4.8,
			reviews:     47,
			featured:    true,
		},
		{
			sku:         "TOL-CRM-RAT",
			name:        "Heavy-Duty Electrician Ratchet Cable Terminal Crimping Plier Kit (0.5mm² - 10mm²)",
			slug:        "electrician-ratchet-crimping-plier-kit",
			category:    "Contractor Tools & Hardware",
			subcategory: "Contractor Crimping Tools",
			shortDesc:   "Precision hardened carbon steel ratchet crimper with self-locking release mechanism and interchangeable terminal crimping dies.",
			fullDesc:    "Essential tool for electrical contractors terminating copper lugs, cord end ferrules, and insulated connectors. Ergonomic bi-material non-slip handles ensure consistent, high-leverage crimp pressure without hand fatigue.",
			image:       "/images/twin cable and others.jpg",
			specs:       `{"Crimping Capacity": "0.5mm² to 10mm² (AWG 22-8)", "Mechanism": "Ergonomic Labor-Saving Ratchet", "Handle": "Non-Slip Dual Component TPR", "Weight": "650g"}`,
			price:       3800.0,
			rating:      4.9,
			reviews:     38,
			featured:    false,
		},
		{
			sku:         "TOL-CLW-HAM",
			name:        "Contractor Drop-Forged Steel Claw Hammer (16oz / 450g Anti-Shock Grip)",
			slug:        "contractor-drop-forged-claw-hammer",
			category:    "Contractor Tools & Hardware",
			subcategory: "Striking Tools",
			shortDesc:   "Solid one-piece forged steel claw hammer with curved claw for effortless nail extraction and vibration-damping fiberglass ergonomic grip.",
			fullDesc:    "Forged high-carbon steel head with precision ground face and high-leverage curved claw for pulling wiring clips and nails. Balanced weight distribution minimizes contractor strain during long installation shifts.",
			image:       "/images/items section layout.jpg",
			specs:       `{"Head Weight": "16 oz / 450 grams", "Head Material": "Drop-Forged High Carbon Steel", "Shaft": "Anti-Vibration Fiberglass Core", "Claw": "High-Leverage Curved Claw"}`,
			price:       1850.0,
			rating:      4.7,
			reviews:     29,
			featured:    false,
		},
		{
			sku:         "TOL-TIE-SET",
			name:        "Industrial UV-Resistant Nylon Cable Ties & Nail Clip Assortment (Pack of 1000)",
			slug:        "uv-resistant-cable-ties-clips-pack-1000",
			category:    "Contractor Tools & Hardware",
			subcategory: "Cable Management & Clips",
			shortDesc:   "Weather-resistant tensile nylon self-locking cable ties and round cable nail clips in assorted sizes for neat cable bundling and conduit fixing.",
			fullDesc:    "Comprehensive contractor pack containing 100mm, 150mm, 200mm, and 300mm black UV-resistant nylon ties along with 4mm, 6mm, 8mm, and 10mm round hardened steel nail clips for clean surface wiring.",
			image:       "/images/twin cable and others.jpg",
			specs:       `{"Quantity": "1000 Pieces Assorted", "Sizes Included": "100mm, 150mm, 200mm, 250mm, 300mm", "Material": "UL-Approved Polyamide Nylon 6/6", "Tensile Strength": "Up to 50 lbs (22kg)"}`,
			price:       1400.0,
			rating:      4.9,
			reviews:     62,
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
			s.image, s.specs, true, s.price, s.rating, s.reviews, s.featured,
		)
		if err != nil {
			return err
		}
	}

	return nil
}
