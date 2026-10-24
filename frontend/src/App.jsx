import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import LightingPage from './components/LightingPage';
import CablesPage from './components/CablesPage';
import ProductCatalog from './components/ProductCatalog';
import ProductDetailModal from './components/ProductDetailModal';
import CartQuotation from './components/CartQuotation';
import ThankYouModal from './components/ThankYouModal';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import ErrorPage from './components/ErrorPage';
import AdminPortal from './components/AdminPortal';
import AdminLogin from './components/AdminLogin';
import TrackQuoteModal from './components/TrackQuoteModal';
import { 
  cacheProductsOffline, 
  getCachedProductsOffline, 
  getCartOffline, 
  saveCartOffline, 
  queueOfflineQuote, 
  syncPendingQuotes 
} from './offline/db';

const API_BASE = '/api';

const checkIsAdminPath = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    path === '/admin' || 
    path.startsWith('/admin/') || 
    search.includes('admin') || 
    hash === '#admin'
  );
};

const getInitialSection = () => {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.toLowerCase();
  if (path.includes('lighting')) return 'lighting';
  if (path.includes('cable') || path.includes('power')) return 'cables';
  if (path.includes('catalog') || path.includes('product') || path.includes('shop')) return 'products';
  if (path.includes('contact')) return 'contact';
  return 'home';
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [isAdminRoute, setIsAdminRoute] = useState(checkIsAdminPath);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminAuth, setAdminAuth] = useState(() => {
    try {
      const saved = localStorage.getItem('kadianga_admin_auth') || localStorage.getItem('voltcraft_admin_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [thankYouResponse, setThankYouResponse] = useState(null);
  const [isTrackQuoteOpen, setIsTrackQuoteOpen] = useState(false);
  const [trackQuotePrefill, setTrackQuotePrefill] = useState('');
  const [syncAlert, setSyncAlert] = useState('');
  const [errorState, setErrorState] = useState(null);

  // Fallback comprehensive seed products in case server is starting or offline
  const fallbackProducts = [
    {
      id: 1,
      sku: "CAB-ARM-4C16",
      name: "4-Core Copper XLPE Armoured Underground Power Cable (16mm² - 95mm²)",
      slug: "4-core-copper-armoured-cable",
      category: "Armoured Cables",
      subcategory: "Low Voltage Power Distribution",
      short_description: "High-grade multi-core copper armoured electrical cable with heavy PVC sheathing, designed for underground and rugged industrial installations.",
      full_description: "Our multi-core armoured cables feature annealed high-conductivity electrolytic copper conductors insulated with cross-linked polyethylene (XLPE) and protected by high-tensile steel wire armouring (SWA). Waterproof, vermin-resistant, and flame-retardant outer sheath. Standard compliance: BS 5467 / IEC 60502-1.",
      image_url: "/images/armured cable.jpg",
      specs: '{"Core Sizes Available": "16mm², 25mm², 35mm², 50mm², 70mm², 95mm²", "Voltage Rating": "600/1000V (0.6/1kV)", "Conductor": "Class 2 Stranded Plain Annealed Copper", "Insulation": "XLPE Cross-linked Polyethylene", "Armouring": "Galvanized Steel Wire Armour (SWA)", "Sheath": "Flame Retardant PVC (Black)", "Operating Temp": "-15°C to +90°C"}',
      in_stock: true,
      base_estimate_price: 2400.00,
      rating: 4.9,
      reviews_count: 38,
      featured: true
    },
    {
      id: 2,
      sku: "CAB-SNG-CON",
      name: "Single Core Pure Copper Building Conduit Wire (1.5mm² - 10mm²)",
      slug: "single-core-building-conduit-wire",
      category: "Single Core Cables",
      subcategory: "Building Conduit Wires",
      short_description: "Top-tier stranded copper residential and commercial single-core building wire available in red, yellow, blue, black, and earth green.",
      full_description: "Premium grade 100% pure copper single-core wires designed for conduit installations, domestic wiring, trunking, and distribution boards. Excellent flexibility and superior insulation resistance preventing short circuits and thermal degradation. Certified to BS 6004.",
      image_url: "/images/single cable.jpg",
      specs: '{"Available Gauges": "1.5mm², 2.5mm², 4.0mm², 6.0mm², 10.0mm²", "Roll Length": "100 Metres", "Colors Available": "Red (Live), Black (Neutral), Yellow, Blue, Green/Yellow (Earth)", "Voltage": "450/750V", "Insulation": "High Dielectric Lead-Free PVC"}',
      in_stock: true,
      base_estimate_price: 4100.00,
      rating: 4.8,
      reviews_count: 64,
      featured: true
    },
    {
      id: 3,
      sku: "CAB-TWN-SET",
      name: "Twin & Earth Flat Power Cable + Workshop Electrical Installation Kit",
      slug: "twin-earth-flat-cable-kit",
      category: "Twin & Earth Cables",
      subcategory: "Surface & Concealed Wiring",
      short_description: "Durable grey PVC twin & earth flat cable paired with breaker switchgear and installation accessories for domestic socket and lighting circuits.",
      full_description: "Standard flat 2-core plus uninsulated circuit protective conductor (CPC) earth wire. Widely used for surface wiring and fixed installation in dry or damp premises. High thermal headroom with minimal voltage drop.",
      image_url: "/images/twin cable and others.jpg",
      specs: '{"Core Sizes": "1.5mm² (Lighting), 2.5mm² (Ring Mains / Sockets)", "Roll Length": "100m Coils", "Conductors": "2 Stranded Copper + 1 Bare Earth", "Max Current": "27A (2.5mm²)", "Sheath Material": "Grey Self-Extinguishing PVC"}',
      in_stock: true,
      base_estimate_price: 5800.00,
      rating: 4.9,
      reviews_count: 42,
      featured: true
    },
    {
      id: 4,
      sku: "LGT-CHN-BRASS",
      name: "Nordic Luxe Brushed Brass Pendant Chandelier (Cluster of 5 Drops)",
      slug: "nordic-luxe-brushed-brass-pendant-chandelier",
      category: "Chandeliers & Lighting",
      subcategory: "Luxury Ceiling Fixtures",
      short_description: "Architectural brushed brass drop pendant chandelier with warm ambient glow, minimalist silhouettes, and adjustable suspension cables.",
      full_description: "Handcrafted from solid spun aluminum with a multi-stage electroplated brushed brass finish. Designed for luxury dining spaces, double-volume living rooms, and hospitality lounges. Supports E27 warm Edison and filament LED bulbs with integrated flicker-free dimming driver compatibility.",
      image_url: "/images/chandelier section.jpg",
      specs: '{"Configuration": "5 Pendant Drop Cluster", "Finish": "Brushed Brass / Antique Gold", "Socket Type": "E27 / LED Warm 2700K - 3000K", "Cable Drop": "Adjustable up to 2.2 Metres", "Voltage": "110V - 240V AC"}',
      in_stock: true,
      base_estimate_price: 25000.00,
      rating: 5.0,
      reviews_count: 29,
      featured: true
    },
    {
      id: 5,
      sku: "SWG-MCB-3P63",
      name: "Commercial 3-Phase MCB Miniature Circuit Breaker (63A 415V)",
      slug: "3-phase-mcb-miniature-circuit-breaker-63a",
      category: "Switchgear & Meters",
      subcategory: "Circuit Protection",
      short_description: "Industrial grade triple pole circuit breaker with 10kA breaking capacity for factory motors, main distribution panels, and commercial meters.",
      full_description: "High-reliability thermal-magnetic circuit breaker engineered to protect three-phase AC circuits against short circuit surges and continuous overload currents.",
      image_url: "/images/twin cable and others.jpg",
      specs: '{"Rated Current": "63 Amps", "Poles": "3-Pole (3P)", "Breaking Capacity": "10 kA", "Tripping Curve": "Type C", "Mounting": "Standard 35mm DIN Rail"}',
      in_stock: true,
      base_estimate_price: 3600.00,
      rating: 4.8,
      reviews_count: 19,
      featured: false
    },
    {
      id: 6,
      sku: "ACC-SCK-USB",
      name: "13A Twin Switched Socket with Dual USB-C Fast Charger (Brushed Black)",
      slug: "13a-twin-socket-dual-usb-c-brushed-black",
      category: "Accessories & Sockets",
      subcategory: "Premium Wall Outlets",
      short_description: "Screwless matte finish architectural dual wall outlet with integrated 20W USB-C Power Delivery and child safety shutter mechanism.",
      full_description: "Upgrade your living or commercial space with modern flat-plate electrical outlets. Includes 2 independent 13A switch toggles and dual integrated USB-C smart charging ports.",
      image_url: "/images/items section layout.jpg",
      specs: '{"Current Rating": "13 Amp Double Gang", "USB Output": "USB-C + USB-A 5V 3.4A / 20W PD", "Faceplate": "Ultra-slim 4mm Matte Polycarbonate", "Safety": "Integrated 3-Pin Safety Shutter"}',
      in_stock: true,
      base_estimate_price: 2100.00,
      rating: 4.9,
      reviews_count: 51,
      featured: false
    },
    {
      id: 7,
      sku: "LGT-CHN-LIN",
      name: "Modern Minimalist Linear LED Island Chandelier (Matte Black)",
      slug: "modern-minimalist-linear-led-island-chandelier",
      category: "Chandeliers & Lighting",
      subcategory: "Island Chandeliers",
      short_description: "Slim architectural aluminum linear suspension chandelier with downward glare-free 3000K warm diffused light for kitchen islands and dining tables.",
      full_description: "Precision CNC milled aluminum profile with an anodized matte black textured powder coat. Equipped with ultra-high CRI 95+ LEDs for authentic color reproduction. Complete with discrete steel wire ceiling mounts and transparent power feeder.",
      image_url: "/images/home hero section.jpg",
      specs: '{"Length": "1200mm", "Power": "36W Warm LED (3000K)", "CRI": ">95", "Suspension": "Up to 1.8M Adjustable", "Material": "Architectural Aviation Aluminum"}',
      in_stock: true,
      base_estimate_price: 18500.00,
      rating: 4.9,
      reviews_count: 22,
      featured: true
    },
    {
      id: 8,
      sku: "LGT-WAL-SCONCE",
      name: "Architectural Bi-Directional Up & Down Wall Sconce Light (Weatherproof)",
      slug: "architectural-bi-directional-up-down-wall-light",
      category: "Chandeliers & Lighting",
      subcategory: "Wall Lights",
      short_description: "Dual beam geometric aluminum wall sconce casting dramatic upward and downward lighting accents across interior corridors and exterior facades.",
      full_description: "Engineered from die-cast aluminum with tempered optical glass diffusers. IP65 rated against dust, rain, and tropical humidity. Ideal for entrance portals, stairwells, and perimeter walls.",
      image_url: "/images/chandelier section.jpg",
      specs: '{"Beams": "Dual Directional (Up & Down)", "Rating": "IP65 Weatherproof", "Power": "2x 6W COB LED", "Finish": "Anodized Dark Bronze", "Voltage": "100-240V AC"}',
      in_stock: true,
      base_estimate_price: 4900.00,
      rating: 4.8,
      reviews_count: 36,
      featured: true
    },
    {
      id: 9,
      sku: "LGT-PND-SMOKE",
      name: "Industrial Vintage Smoky Glass Dome Pendant Luminaire",
      slug: "industrial-vintage-smoky-glass-dome-pendant",
      category: "Chandeliers & Lighting",
      subcategory: "Pendant Lights",
      short_description: "Hand-blown translucent smoky grey glass pendant light with antique bronze hardware and braided vintage fabric cable.",
      full_description: "Features organic mouth-blown bubble glass that gently diffuses filament light without harsh glare. Includes 1.5m vintage twisted fabric suspension cord and matching heavy brass canopy.",
      image_url: "/images/herosection.webp",
      specs: '{"Glass Diameter": "Ø 280mm", "Finish": "Translucent Smoky Grey + Antique Bronze", "Socket": "E27 Screw Base (Max 60W)", "Cord": "1.5m Braided Fabric Cord"}',
      in_stock: true,
      base_estimate_price: 3800.00,
      rating: 4.7,
      reviews_count: 18,
      featured: false
    },
    {
      id: 10,
      sku: "CAB-FLX-RUB",
      name: "Submersible Heavy-Duty Flexible Rubber Drop Cable (3-Core 4mm²)",
      slug: "submersible-heavy-duty-flexible-rubber-cable",
      category: "Single Core Cables",
      subcategory: "Flexible & Submersible Wires",
      short_description: "Waterproof synthetic EPR rubber insulated multi-strand flexible drop cable designed for boreholes, water pumps, and heavy workshop equipment.",
      full_description: "Oil-resistant, abrasion-resistant, and completely waterproof flexible cable rated for continuous underwater immersion. Manufactured to H07RN-F specifications.",
      image_url: "/images/armured cable.jpg",
      specs: '{"Conductors": "3-Core 4.0mm² Flexible Annealed Copper", "Insulation": "EPR Rubber", "Outer Sheath": "Heavy PCP Rubber (Black)", "Temp Range": "-25°C to +85°C", "Voltage": "450/750V"}',
      in_stock: true,
      base_estimate_price: 3200.00,
      rating: 4.9,
      reviews_count: 27,
      featured: false
    },
    {
      id: 11,
      sku: "MTR-SMART-DIN",
      name: "Digital Single-Phase DIN-Rail Smart Energy KWh Meter",
      slug: "digital-single-phase-kwh-meter",
      category: "Switchgear & Meters",
      subcategory: "Energy Meters",
      short_description: "High-precision backlit LCD digital electricity meter for tenant sub-metering, rental units, and commercial energy management.",
      full_description: "Class 1 accuracy solid-state active energy sub-meter. Measures real-time active power (W), cumulative kilowatt-hours (kWh), voltage (V), and amperage (A).",
      image_url: "/images/twin cable and others.jpg",
      specs: '{"Current Range": "5(80)A", "Voltage": "230V AC ±20%", "Display": "7+1 Digits Backlit LCD", "Accuracy": "Class 1.0", "Mounting": "35mm DIN Rail"}',
      in_stock: true,
      base_estimate_price: 3200.00,
      rating: 4.7,
      reviews_count: 23,
      featured: false
    },
    {
      id: 12,
      sku: "ACC-DMR-LED",
      name: "Universal Rotary LED Dimmer Switch (2-Way 250W Trailing Edge)",
      slug: "universal-rotary-led-dimmer-switch",
      category: "Accessories & Sockets",
      subcategory: "Lighting Controls",
      short_description: "Smooth, flicker-free trailing-edge rotary dimmer optimized for dimmable LED chandeliers, spotlights, and ambient fixtures.",
      full_description: "Equipped with advanced microcontroller technology that automatically senses load characteristics to eliminate LED humming, buzz, and low-end ghosting.",
      image_url: "/images/items section layout.jpg",
      specs: '{"Max Load": "250W LED / 400W Halogen", "Dimming Type": "Trailing Edge (Phase Cut)", "Way": "1-Way or 2-Way Switching", "Knob Finish": "Brushed Metallic"}',
      in_stock: true,
      base_estimate_price: 2450.00,
      rating: 4.8,
      reviews_count: 31,
      featured: false
    }
  ];

  // Catalog fetch function (network with fallback to IndexedDB)
  const loadCatalog = async () => {
    try {
      const res = await fetch(`${API_BASE}/products?limit=100`);
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
          await cacheProductsOffline(data.products);
          return;
        }
      }
    } catch (err) {
      console.warn('Network fetch failed, checking offline cache:', err);
    }

    // Check IndexedDB
    const cached = await getCachedProductsOffline();
    if (cached && cached.length > 0) {
      setProducts(cached);
    } else {
      setProducts(fallbackProducts);
      await cacheProductsOffline(fallbackProducts);
    }
  };

  // Admin Endpoint Routing Handlers
  const handleAdminLoginSuccess = (authData) => {
    try {
      localStorage.setItem('kadianga_admin_auth', JSON.stringify(authData));
    } catch (e) {
      console.warn('Local storage write failed:', e);
    }
    setAdminAuth(authData);
    setIsAdminRoute(true);
    loadCatalog();
  };

  const handleAdminLogout = () => {
    try {
      localStorage.removeItem('kadianga_admin_auth');
      localStorage.removeItem('voltcraft_admin_auth');
    } catch (e) {
      console.warn('Local storage clear failed:', e);
    }
    setAdminAuth(null);
    loadCatalog();
  };

  const handleExitAdmin = () => {
    try {
      window.history.pushState({}, '', '/');
    } catch (e) {}
    setIsAdminRoute(false);
    loadCatalog();
  };

  // Initialize Cart, Catalog and Route listeners
  useEffect(() => {
    const handleUrlRoute = () => {
      setIsAdminRoute(checkIsAdminPath());
      setActiveSection(getInitialSection());
    };

    window.addEventListener('popstate', handleUrlRoute);
    window.addEventListener('hashchange', handleUrlRoute);

    // 1. Load cart from offline local storage
    const savedCart = getCartOffline();
    if (savedCart && savedCart.length > 0) {
      setCart(savedCart);
    }

    // 2. Fetch catalog products
    loadCatalog();

    // 3. Network status listeners
    const handleOnline = async () => {
      setIsOnline(true);
      try {
        const syncedCount = await syncPendingQuotes(API_BASE);
        if (syncedCount > 0) {
          setSyncAlert(`Online: ${syncedCount} queued quotations synced successfully.`);
          setTimeout(() => setSyncAlert(''), 5000);
        }
      } catch (err) {
        console.warn('Sync error on reconnect:', err);
      }
      loadCatalog();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check if already online
    if (navigator.onLine) {
      syncPendingQuotes(API_BASE)
        .then(count => {
          if (count > 0) {
            setSyncAlert(`Online: ${count} offline quotations synced.`);
            setTimeout(() => setSyncAlert(''), 4000);
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('popstate', handleUrlRoute);
      window.removeEventListener('hashchange', handleUrlRoute);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync cart changes to offline storage
  useEffect(() => {
    saveCartOffline(cart);
  }, [cart]);

  // Cart operations
  const handleAddToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + (product.quantity || 1) } 
            : item
        );
      }
      return [...prev, { ...product, quantity: product.quantity || 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Submit quotation (handles offline queueing if offline)
  const handleSubmitQuote = async (payload) => {
    const clientUUID = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    const fullPayload = { ...payload, client_uuid: clientUUID };

    if (!navigator.onLine) {
      // Offline mode: queue locally in IndexedDB
      await queueOfflineQuote(fullPayload);
      const offlineMockResp = {
        quote_number: `EQ-OFFLINE-${Date.now().toString().slice(-4)}`,
        status: 'pending_sync',
        whatsapp_link: `https://wa.me/254712880970?text=${encodeURIComponent(`Hello Kadianga Electricals, offline quotation logged: ${payload.customer_name}`)}`,
        quote: {
          customer_name: payload.customer_name,
          customer_email: payload.customer_email,
          customer_phone: payload.customer_phone,
          customer_location: payload.customer_location,
          notes: payload.notes
        }
      };
      setThankYouResponse(offlineMockResp);
      setIsCartOpen(false);
      setCart([]);
      return;
    }

    // Online submission
    const res = await fetch(`${API_BASE}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload)
    });

    if (!res.ok) {
      // If server error, queue offline as fallback
      await queueOfflineQuote(fullPayload);
      throw new Error('Server connection issue. Quotation stored in local sync queue.');
    }

    const data = await res.json();
    setThankYouResponse(data);
    setIsCartOpen(false);
    setCart([]);
  };

  // Page navigation handler with browser history synchronization
  const handleNavigate = (sectionId) => {
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const url = sectionId === 'home' ? '/' : `/${sectionId}`;
      window.history.pushState({ section: sectionId }, '', url);
    } catch (e) {}
  };

  // Loading Screen simulation
  if (loading) {
    return (
      <LoadingScreen
        message="Initializing Kadianga Electricals..."
        onComplete={() => setLoading(false)}
      />
    );
  }

  // Dedicated Admin Endpoint Mode (/admin, /admin/login, #admin, ?admin)
  if (isAdminRoute) {
    if (adminAuth) {
      return (
        <AdminPortal
          apiBase={API_BASE}
          adminToken={adminAuth?.token || ""}
          onExit={handleExitAdmin}
          onLogout={handleAdminLogout}
        />
      );
    }
    return (
      <AdminLogin
        onLoginSuccess={handleAdminLoginSuccess}
        onCancel={handleExitAdmin}
        defaultEmail="admin@kadianga.store"
      />
    );
  }

  // Error Page Mode matching error message inspo.jpg
  if (errorState) {
    return (
      <ErrorPage
        type={errorState}
        onGoHome={() => setErrorState(null)}
        onRetry={() => setErrorState(null)}
        shopEmail="mikewillmakeit2004@gmail.com"
        shopWhatsApp="254712880970"
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#121212] flex flex-col justify-between selection:bg-[#e67e22] selection:text-white font-sans">
      
      {/* Offline Sync Banner if active */}
      {syncAlert && (
        <div className="sticky top-0 z-50 bg-emerald-600 text-white text-xs py-2 px-4 text-center font-semibold shadow-md">
          {syncAlert}
        </div>
      )}

      {/* Main Navigation matching inspo */}
      <Navbar
        cartCount={cart.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTrackQuote={() => {
          setTrackQuotePrefill('');
          setIsTrackQuoteOpen(true);
        }}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => handleNavigate('products')}
      />

      <main className="flex-1 w-full">
        
        {/* Page 1: Home Page */}
        {activeSection === 'home' && (
          <HomePage
            products={products}
            onNavigate={handleNavigate}
            onSelectProduct={setSelectedProduct}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* Page 2: Dedicated Lighting Page */}
        {activeSection === 'lighting' && (
          <LightingPage
            products={products}
            onSelectProduct={setSelectedProduct}
            onAddToCart={handleAddToCart}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            loading={false}
          />
        )}

        {/* Page 3: Dedicated Power Cables & Hardware Page */}
        {activeSection === 'cables' && (
          <CablesPage
            products={products}
            onSelectProduct={setSelectedProduct}
            onAddToCart={handleAddToCart}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            loading={false}
          />
        )}

        {/* Page 4: Master Products Catalog Page */}
        {activeSection === 'products' && (
          <ProductCatalog
            products={products}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onSelectProduct={setSelectedProduct}
            onAddToCart={handleAddToCart}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            loading={false}
            title="Complete Shop Inventory"
            subtitle="Explore our comprehensive catalog of certified copper cables, industrial hardware, and architectural lighting fixtures with direct contractor quotations."
          />
        )}

        {/* Page 5: Contact Page */}
        {activeSection === 'contact' && (
          <div className="w-full">
            <ContactSection />
          </div>
        )}

      </main>

      {/* Footer Section matching footer design.jpg */}
      <Footer 
        onNavigate={handleNavigate} 
        onOpenTrackQuote={() => {
          setTrackQuotePrefill('');
          setIsTrackQuoteOpen(true);
        }}
      />

      {/* Product Detail Modal (Alibaba / Amazon style) */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          shopWhatsApp="254712880970"
        />
      )}

      {/* Slide-out / Modal Quotation Cart matching cart to request quotation.jpg */}
      {isCartOpen && (
        <CartQuotation
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onClose={() => setIsCartOpen(false)}
          onSubmitQuote={handleSubmitQuote}
          shopWhatsApp="254712880970"
        />
      )}

      {/* Thank You Screen matching thank you inspo.jpg */}
      {thankYouResponse && (
        <ThankYouModal
          quoteResponse={thankYouResponse}
          onClose={() => setThankYouResponse(null)}
          onTrackQuote={(quoteNum) => {
            setTrackQuotePrefill(quoteNum);
            setIsTrackQuoteOpen(true);
          }}
          onReset={() => {
            setThankYouResponse(null);
            handleNavigate('products');
          }}
        />
      )}

      {/* Real-time Quotation Tracker Modal (No Login Required) */}
      <TrackQuoteModal
        isOpen={isTrackQuoteOpen}
        onClose={() => setIsTrackQuoteOpen(false)}
        initialQuoteNumber={trackQuotePrefill}
        apiBase={API_BASE}
        companyPhone="+254712880970"
        companyWhatsApp="254712880970"
      />

    </div>
  );
}
