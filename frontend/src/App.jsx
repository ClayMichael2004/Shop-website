import React, { useState, useEffect } from 'react';
import { Check, ShoppingBag, X } from 'lucide-react';
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
import ErrorBoundary from './components/ErrorBoundary';
import TrackQuoteModal from './components/TrackQuoteModal';
import CookieConsent from './components/CookieConsent';
import PrivacyTermsModal from './components/PrivacyTermsModal';

// Code-splitting: lazy load Admin bundles to isolate from standard customer bundles
const AdminPortal = React.lazy(() => import('./components/AdminPortal'));
const AdminLogin = React.lazy(() => import('./components/AdminLogin'));
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
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState(() => {
    if (checkIsAdminPath()) {
      try {
        const saved = localStorage.getItem('kadianga_admin_auth') || localStorage.getItem('voltcraft_admin_auth');
        return !saved;
      } catch {
        return true;
      }
    }
    return false;
  });
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
  const [cartToast, setCartToast] = useState(null);
  const [isPrivacyTermsOpen, setIsPrivacyTermsOpen] = useState(false);
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
    },
    {
      id: 13,
      sku: "FIT-SWT-2G2W",
      name: "Schneider Style 2-Gang 2-Way Flush Rocker Light Switch (Matt White)",
      slug: "schneider-style-2gang-2way-light-switch",
      category: "Electrical Fittings",
      subcategory: "Wall Switches & Faceplates",
      short_description: "High-durability 16AX 2-gang 2-way modular rocker wall switch with flame-retardant polycarbonate housing.",
      full_description: "Engineered for reliable domestic and commercial lighting control. Features silver alloy contact points, smooth tactile switching action, and antibacterial scratch-resistant surface finish. Standard 86x86mm flush mounting.",
      image_url: "/images/items section layout.jpg",
      specs: '{"Gang": "2-Gang", "Way": "2-Way Switching", "Rating": "16AX 250V AC", "Material": "UV-Stabilized Flame-Retardant Polycarbonate", "Standard": "IEC 60669-1"}',
      in_stock: true,
      base_estimate_price: 1250.00,
      rating: 4.9,
      reviews_count: 44,
      featured: false
    },
    {
      id: 14,
      sku: "FIT-JNC-IP66",
      name: "IP66 Waterproof Exterior Adaptable Junction Box with M20 Glands",
      slug: "ip66-waterproof-exterior-junction-box",
      category: "Electrical Fittings",
      subcategory: "Conduit & Junction Fittings",
      short_description: "Weatherproof and dust-tight heavy PVC junction box with rubber gasket seals and multi-directional cable knockout entries.",
      full_description: "Designed for outdoor security lighting, perimeter wiring, and industrial conduit branches. Includes captive stainless steel screws and silicone sealing gasket for dependable IP66 ingress protection.",
      image_url: "/images/twin cable and others.jpg",
      specs: '{"Dimensions": "150 x 110 x 70 mm", "Protection": "IP66 Dust & Water Jet Proof", "Entries": "10 Knockout Gland Ports (M20)", "Material": "High Impact ABS"}',
      in_stock: true,
      base_estimate_price: 950.00,
      rating: 4.8,
      reviews_count: 28,
      featured: false
    },
    {
      id: 15,
      sku: "ELC-AVR-5KVA",
      name: "Digital Heavy-Duty Automatic Voltage Regulator (AVR / Stabilizer 5000VA)",
      slug: "digital-avr-voltage-stabilizer-5000va",
      category: "Electronics & Appliances",
      subcategory: "Voltage Stabilizers & Regulators",
      short_description: "Microprocessor-controlled servo motor voltage stabilizer protecting sensitive electronics, compressors, and pumps against brownouts and power surges.",
      full_description: "Reliable voltage regulation for home, office, and light industrial equipment. Wide input voltage tolerance (130V - 260V AC) delivering stable 230V output. Dual digital meter displays real-time input and output voltages.",
      image_url: "/images/power.jpg",
      specs: '{"Capacity": "5000VA / 5kVA", "Input Range": "130V - 260V AC", "Output Voltage": "230V AC ±2%", "Display": "Dual Digital LED", "Protection": "High/Low Voltage, Overload & Delay"}',
      in_stock: true,
      base_estimate_price: 19500.00,
      rating: 4.9,
      reviews_count: 36,
      featured: true
    },
    {
      id: 16,
      sku: "ELC-EXT-SURG",
      name: "Industrial 4-Way Heavy Duty Surge Protected Extension Cable Reel (25 Metres)",
      slug: "industrial-heavy-duty-extension-reel-25m",
      category: "Electronics & Appliances",
      subcategory: "Extensions & Surge Protection",
      short_description: "Rugged steel framed portable cable extension drum reel with thermal overload circuit breaker and 4 shuttered 13A safety sockets.",
      full_description: "Contractor grade extension reel equipped with 25 metres of 3-core 1.5mm² flexible heavy duty PVC cable. Built-in thermal cutout switch prevents dangerous overheating during heavy continuous power tool operation.",
      image_url: "/images/armured cable.jpg",
      specs: '{"Cable Length": "25 Metres", "Cable Type": "3-Core 1.5mm² Heavy Duty", "Sockets": "4x 13A Shuttered Outlets", "Safety": "Thermal Cutout Reset Switch", "Max Load": "3120W Fully Uncoiled"}',
      in_stock: true,
      base_estimate_price: 6800.00,
      rating: 4.8,
      reviews_count: 21,
      featured: false
    },
    {
      id: 17,
      sku: "SOL-PNL-550W",
      name: "Tier-1 Monocrystalline Half-Cell High Efficiency Solar Panel (550W)",
      slug: "tier-1-monocrystalline-solar-panel-550w",
      category: "Solar Systems & Accessories",
      subcategory: "Solar PV Panels",
      short_description: "Ultra-high efficiency monocrystalline PERC half-cut solar PV module engineered for rooftop residential and off-grid contractor installations.",
      full_description: "Delivers maximum kilowatt output even in low ambient light or high temperature conditions. Features multi-busbar technology for reduced resistance losses, anti-reflective tempered glass, and anodized aluminum frame.",
      image_url: "/images/herosection.webp",
      specs: '{"Peak Power (Pmax)": "550W", "Efficiency": "21.3%", "Cell Type": "Monocrystalline Half-Cut PERC", "Frame": "Anodized Corrosion-Resistant Aluminum", "Warranty": "25 Years Linear Power Output"}',
      in_stock: true,
      base_estimate_price: 17500.00,
      rating: 5.0,
      reviews_count: 53,
      featured: true
    },
    {
      id: 18,
      sku: "SOL-INV-5KW",
      name: "Hybrid Pure Sine Wave Solar Inverter with 80A MPPT Controller (5kW / 48V)",
      slug: "hybrid-pure-sine-wave-solar-inverter-5kw",
      category: "Solar Systems & Accessories",
      subcategory: "Inverters & Storage",
      short_description: "Smart multifunctional hybrid power inverter combining MPPT solar charger, pure sine wave inverter, and AC battery charger with LCD status screen.",
      full_description: "Seamless automatic changeover between solar power, lithium/gel battery backup, and utility grid power. High surge capacity for starting refrigerators, water pumps, and air conditioning units.",
      image_url: "/images/power.jpg",
      specs: '{"Rated Power": "5000VA / 5000W", "Battery Voltage": "48V DC", "MPPT Range": "120V - 450V DC", "Max Solar Input": "5000W", "Waveform": "Pure Sine Wave"}',
      in_stock: true,
      base_estimate_price: 85000.00,
      rating: 4.9,
      reviews_count: 19,
      featured: false
    },
    {
      id: 19,
      sku: "SOL-FLD-200W",
      name: "All-in-One Solar LED Security Floodlight with PIR Motion Sensor (200W IP67)",
      slug: "solar-led-security-floodlight-200w",
      category: "Solar Systems & Accessories",
      subcategory: "Solar Outdoor Lighting",
      short_description: "Zero-electricity outdoor commercial solar floodlight with integrated high-capacity lithium iron phosphate (LiFePO4) battery and wireless remote.",
      full_description: "Heavy-duty die-cast aluminum solar luminaire providing ultra-wide beam perimeter security illumination. Dusk-to-dawn automatic intelligent sensor controller keeps perimeter well lit through rainy nights.",
      image_url: "/images/chandelier section.jpg",
      specs: '{"Power": "200W High Lumen LED", "Battery": "3.2V 25Ah LiFePO4", "Lighting Time": "12-16 Hours Continuous", "Waterproof Rating": "IP67", "Control": "Auto Dusk-to-Dawn + Infrared Remote"}',
      in_stock: true,
      base_estimate_price: 5200.00,
      rating: 4.8,
      reviews_count: 47,
      featured: true
    },
    {
      id: 20,
      sku: "TOL-CRM-RAT",
      name: "Heavy-Duty Electrician Ratchet Cable Terminal Crimping Plier Kit (0.5mm² - 10mm²)",
      slug: "electrician-ratchet-crimping-plier-kit",
      category: "Contractor Tools & Hardware",
      subcategory: "Contractor Crimping Tools",
      short_description: "Precision hardened carbon steel ratchet crimper with self-locking release mechanism and interchangeable terminal crimping dies.",
      full_description: "Essential tool for electrical contractors terminating copper lugs, cord end ferrules, and insulated connectors. Ergonomic bi-material non-slip handles ensure consistent, high-leverage crimp pressure without hand fatigue.",
      image_url: "/images/twin cable and others.jpg",
      specs: '{"Crimping Capacity": "0.5mm² to 10mm² (AWG 22-8)", "Mechanism": "Ergonomic Labor-Saving Ratchet", "Handle": "Non-Slip Dual Component TPR", "Weight": "650g"}',
      in_stock: true,
      base_estimate_price: 3800.00,
      rating: 4.9,
      reviews_count: 38,
      featured: false
    },
    {
      id: 21,
      sku: "TOL-CLW-HAM",
      name: "Contractor Drop-Forged Steel Claw Hammer (16oz / 450g Anti-Shock Grip)",
      slug: "contractor-drop-forged-claw-hammer",
      category: "Contractor Tools & Hardware",
      subcategory: "Striking Tools",
      short_description: "Solid one-piece forged steel claw hammer with curved claw for effortless nail extraction and vibration-damping fiberglass ergonomic grip.",
      full_description: "Forged high-carbon steel head with precision ground face and high-leverage curved claw for pulling wiring clips and nails. Balanced weight distribution minimizes contractor strain during long installation shifts.",
      image_url: "/images/items section layout.jpg",
      specs: '{"Head Weight": "16 oz / 450 grams", "Head Material": "Drop-Forged High Carbon Steel", "Shaft": "Anti-Vibration Fiberglass Core", "Claw": "High-Leverage Curved Claw"}',
      in_stock: true,
      base_estimate_price: 1850.00,
      rating: 4.7,
      reviews_count: 29,
      featured: false
    },
    {
      id: 22,
      sku: "TOL-TIE-SET",
      name: "Industrial UV-Resistant Nylon Cable Ties & Nail Clip Assortment (Pack of 1000)",
      slug: "uv-resistant-cable-ties-clips-pack-1000",
      category: "Contractor Tools & Hardware",
      subcategory: "Cable Management & Clips",
      short_description: "Weather-resistant tensile nylon self-locking cable ties and round cable nail clips in assorted sizes for neat cable bundling and conduit fixing.",
      full_description: "Comprehensive contractor pack containing 100mm, 150mm, 200mm, and 300mm black UV-resistant nylon ties along with 4mm, 6mm, 8mm, and 10mm round hardened steel nail clips for clean surface wiring.",
      image_url: "/images/twin cable and others.jpg",
      specs: '{"Quantity": "1000 Pieces Assorted", "Sizes Included": "100mm, 150mm, 200mm, 250mm, 300mm", "Material": "UL-Approved Polyamide Nylon 6/6", "Tensile Strength": "Up to 50 lbs (22kg)"}',
      in_stock: true,
      base_estimate_price: 1400.00,
      rating: 4.9,
      reviews_count: 62,
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
    setIsStaffLoginOpen(false);
    setIsAdminRoute(true);
    try {
      window.history.pushState({ section: 'admin' }, '', '/admin');
    } catch (e) {}
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
    setIsAdminRoute(false);
    setIsStaffLoginOpen(false);
    try {
      window.history.pushState({}, '', '/');
    } catch (e) {}
    loadCatalog();
  };

  const handleExitAdmin = () => {
    try {
      window.history.pushState({}, '', '/');
    } catch (e) {}
    setIsAdminRoute(false);
    setIsStaffLoginOpen(false);
    loadCatalog();
  };

  // Initialize Cart, Catalog and Route listeners
  useEffect(() => {
    const handleUrlRoute = () => {
      const isAdmin = checkIsAdminPath();
      setIsAdminRoute(isAdmin);
      if (isAdmin && !adminAuth) {
        setIsStaffLoginOpen(true);
      }
      setActiveSection(getInitialSection());
    };

    window.addEventListener('popstate', handleUrlRoute);
    window.addEventListener('hashchange', handleUrlRoute);

    // Global keyboard shortcut to open staff login: Ctrl+Shift+A or Cmd+Shift+A
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        if (adminAuth) {
          setIsAdminRoute(prev => !prev);
        } else {
          setIsStaffLoginOpen(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

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
      window.removeEventListener('keydown', handleKeyDown);
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
    // Add product quickly without redirecting to cart modal
    setCartToast({
      name: product.name,
      quantity: product.quantity || 1
    });
    setTimeout(() => {
      setCartToast(null);
    }, 3500);
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

  // Page navigation handler with browser history synchronization and optional category selection
  const handleNavigate = (sectionId, category = null) => {
    setActiveSection(sectionId);
    if (category) {
      setSelectedCategory(category);
    } else if (sectionId === 'products') {
      setSelectedCategory('All');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const url = sectionId === 'home' ? '/' : `/${sectionId}`;
      window.history.pushState({ section: sectionId, category }, '', url);
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

  // Dedicated Admin Endpoint Mode (/admin, /admin/login, #admin, ?admin) - active when authenticated
  if (isAdminRoute && adminAuth) {
    return (
      <ErrorBoundary onReset={handleExitAdmin}>
        <React.Suspense fallback={
          <div className="min-h-screen w-full flex items-center justify-center bg-[#faf9f6]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-neutral-300 border-t-[#e67e22] rounded-full animate-spin"></div>
              <p className="text-xs uppercase tracking-widest text-neutral-600 font-bold">Loading Staff Portal...</p>
            </div>
          </div>
        }>
          <AdminPortal
            apiBase={API_BASE}
            adminToken={adminAuth?.token || ""}
            onExit={handleExitAdmin}
            onLogout={handleAdminLogout}
          />
        </React.Suspense>
      </ErrorBoundary>
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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#faf9f6] text-[#121212] flex flex-col justify-between selection:bg-[#e67e22] selection:text-white font-sans">
      
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
        onOpenStaffLogin={() => {
          if (adminAuth) {
            setIsAdminRoute(true);
            try {
              window.history.pushState({ section: 'admin' }, '', '/admin');
            } catch (e) {}
          } else {
            setIsStaffLoginOpen(true);
          }
        }}
        activeSection={activeSection}
        activeCategory={selectedCategory}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => handleNavigate('products')}
      />

      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        
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
        onOpenPrivacyTerms={() => setIsPrivacyTermsOpen(true)}
        onOpenStaffLogin={() => {
          if (adminAuth) {
            setIsAdminRoute(true);
            try {
              window.history.pushState({ section: 'admin' }, '', '/admin');
            } catch (e) {}
          } else {
            setIsStaffLoginOpen(true);
          }
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

      {/* Customer Privacy & Terms Modal (KDPA 2019 & Quotation Terms) */}
      <PrivacyTermsModal
        isOpen={isPrivacyTermsOpen}
        onClose={() => setIsPrivacyTermsOpen(false)}
      />

      {/* Floating Customer Privacy & Essential Storage Notice */}
      <CookieConsent
        onOpenPrivacyTerms={() => setIsPrivacyTermsOpen(true)}
      />

      {/* Centered Staff Login Modal (Lazy Loaded: Zero Admin Code in Customer Initial Bundle) */}
      {isStaffLoginOpen && (
        <React.Suspense fallback={null}>
          <AdminLogin
            onLoginSuccess={handleAdminLoginSuccess}
            onCancel={() => {
              setIsStaffLoginOpen(false);
              setIsAdminRoute(false);
              try {
                window.history.pushState({}, '', '/');
              } catch (e) {}
            }}
            defaultEmail="admin@kadianga.store"
          />
        </React.Suspense>
      )}

      {/* Floating Instant Toast Notification when Quick-Adding to Cart */}
      {cartToast && (
        <div 
          className="fixed bottom-5 right-4 sm:right-6 z-[80] max-w-sm w-[calc(100%-2rem)] sm:w-auto bg-[#18181b]/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3 animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Added to Quotation Cart</p>
              <p className="text-[11px] text-neutral-400 truncate max-w-[180px] sm:max-w-[220px]">{cartToast.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCartToast(null);
                setIsCartOpen(true);
              }}
              className="px-3 py-1.5 bg-[#e67e22] hover:bg-[#d35400] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>View</span>
            </button>
            <button
              type="button"
              onClick={() => setCartToast(null)}
              className="p-1 text-neutral-400 hover:text-white transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
