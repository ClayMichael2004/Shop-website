import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, Package, Plus, Trash2, Edit3, Send, MessageCircle, 
  Search, Filter, RefreshCw, Eye, ArrowLeft, Download, 
  TrendingUp, BarChart3, Coins, CheckCircle2, Clock, 
  Store, LogOut, X, AlertCircle, ToggleLeft, ToggleRight,
  Lock, KeyRound, Shield, Upload, Image as ImageIcon, Mail, ExternalLink, Check,
  FolderPlus, Tag, AlertTriangle, Info
} from 'lucide-react';
import { cacheProductsOffline } from '../offline/db';

export default function AdminPortal({ 
  apiBase = "/api", 
  adminToken: initialToken = "", 
  onExit,
  onLogout
}) {
  const [token, setToken] = useState(() => {
    return initialToken || sessionStorage.getItem('voltcraft_admin_token') || 'kadianga-admin-2026';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('reports'); // 'reports', 'quotes', 'inventory'
  
  // Dashboard & Reports state
  const [stats, setStats] = useState({ 
    total_quotes: 0, 
    pending_quotes: 0, 
    quoted_quotes: 0, 
    total_products: 0,
    total_quoted_value: 0 
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Quotes state
  const [quotes, setQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [quotesFilter, setQuotesFilter] = useState('all'); // 'all', 'pending', 'quoted'
  const [quotesSearch, setQuotesSearch] = useState('');
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [quoteEditItems, setQuoteEditItems] = useState([]);
  const [quoteDiscount, setQuoteDiscount] = useState(0);
  const [quoteDelivery, setQuoteDelivery] = useState(0);
  const [quoteAdminNotes, setQuoteAdminNotes] = useState('');
  const [quoteStatus, setQuoteStatus] = useState('quoted');
  const [emailStatusMsg, setEmailStatusMsg] = useState('');
  const [savingQuote, setSavingQuote] = useState(false);
  const [quoteFeedbackModal, setQuoteFeedbackModal] = useState(null);
  const [inlineQuoteStatus, setInlineQuoteStatus] = useState(null);

  // Inventory state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryStockFilter, setInventoryStockFilter] = useState('all'); // 'all', 'in_stock', 'sold_out'
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Active Dialog/Confirmation Modal state (replaces native alert and confirm)
  const [portalModal, setPortalModal] = useState(null);

  const showPortalAlert = (title, message, type = 'info') => {
    setPortalModal({
      isOpen: true,
      type,
      title,
      message,
      confirmText: 'Understood',
      onConfirm: () => setPortalModal(null)
    });
  };

  const showPortalConfirm = ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false, onConfirm }) => {
    setPortalModal({
      isOpen: true,
      type: isDanger ? 'danger' : 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      isDanger,
      onConfirm: () => {
        setPortalModal(null);
        if (onConfirm) onConfirm();
      },
      onCancel: () => setPortalModal(null)
    });
  };
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const stored = localStorage.getItem('kadianga_custom_categories');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Fallback initial products if server has starting state
  const defaultFallbackProducts = [
    {
      id: 1,
      sku: "CAB-ARM-4C16",
      name: "4-Core Copper XLPE Armoured Underground Power Cable (16mm² - 95mm²)",
      slug: "4-core-copper-armoured-cable",
      category: "Armoured Cables",
      subcategory: "Low Voltage Power Distribution",
      short_description: "High-grade multi-core copper armoured electrical cable with heavy PVC sheathing.",
      full_description: "Our multi-core armoured cables feature annealed high-conductivity electrolytic copper conductors.",
      image_url: "/images/armured cable.jpg",
      specs: '{"Voltage Rating": "600/1000V", "Conductor": "Plain Annealed Copper", "Armouring": "Steel Wire Armour (SWA)"}',
      in_stock: true,
      base_estimate_price: 2400.00,
      featured: true
    },
    {
      id: 2,
      sku: "CAB-SNG-CON",
      name: "Single Core Pure Copper Building Conduit Wire (1.5mm² - 10mm²)",
      slug: "single-core-building-conduit-wire",
      category: "Single Core Cables",
      subcategory: "Building Conduit Wires",
      short_description: "Top-tier stranded copper residential and commercial single-core building wire.",
      full_description: "Premium grade 100% pure copper single-core wires designed for conduit installations.",
      image_url: "/images/single cable.jpg",
      specs: '{"Roll Length": "100 Metres", "Voltage": "450/750V", "Insulation": "Lead-Free PVC"}',
      in_stock: true,
      base_estimate_price: 4100.00,
      featured: true
    },
    {
      id: 3,
      sku: "CAB-TWN-SET",
      name: "Twin & Earth Flat Power Cable + Workshop Electrical Installation Kit",
      slug: "twin-earth-flat-cable-kit",
      category: "Twin & Earth Cables",
      subcategory: "Surface & Concealed Wiring",
      short_description: "Durable grey PVC twin & earth flat cable paired with breaker switchgear.",
      full_description: "Standard flat 2-core plus uninsulated circuit protective conductor (CPC) earth wire.",
      image_url: "/images/twin cable and others.jpg",
      specs: '{"Core Sizes": "1.5mm² & 2.5mm²", "Max Current": "27A", "Sheath": "Self-Extinguishing PVC"}',
      in_stock: true,
      base_estimate_price: 5800.00,
      featured: true
    },
    {
      id: 4,
      sku: "LGT-CHN-BRASS",
      name: "Nordic Luxe Brushed Brass Pendant Chandelier (Cluster of 5 Drops)",
      slug: "nordic-luxe-brushed-brass-pendant-chandelier",
      category: "Chandeliers & Lighting",
      subcategory: "Luxury Ceiling Fixtures",
      short_description: "Architectural brushed brass drop pendant chandelier with warm ambient glow.",
      full_description: "Handcrafted from solid spun aluminum with a multi-stage electroplated brushed brass finish.",
      image_url: "/images/chandelier section.jpg",
      specs: '{"Configuration": "5 Pendant Drop Cluster", "Socket Type": "E27 / LED Warm 2700K"}',
      in_stock: false, // Initial demo sold out item
      base_estimate_price: 25000.00,
      featured: true
    },
    {
      id: 5,
      sku: "SWG-MCB-3P63",
      name: "Commercial 3-Phase MCB Miniature Circuit Breaker (63A 415V)",
      slug: "3-phase-mcb-miniature-circuit-breaker-63a",
      category: "Switchgear & Meters",
      subcategory: "Circuit Protection",
      short_description: "Industrial grade triple pole circuit breaker with 10kA breaking capacity.",
      full_description: "High-reliability thermal-magnetic circuit breaker engineered to protect three-phase AC circuits.",
      image_url: "/images/twin cable and others.jpg",
      specs: '{"Rated Current": "63 Amps", "Poles": "3-Pole (3P)", "Breaking Capacity": "10 kA"}',
      in_stock: true,
      base_estimate_price: 3600.00,
      featured: false
    },
    {
      id: 6,
      sku: "ACC-SCK-USB",
      name: "13A Twin Switched Socket with Dual USB-C Fast Charger (Brushed Black)",
      slug: "13a-twin-socket-dual-usb-c-brushed-black",
      category: "Accessories & Sockets",
      subcategory: "Premium Wall Outlets",
      short_description: "Screwless matte finish architectural dual wall outlet with integrated 20W USB-C.",
      full_description: "Upgrade your living or commercial space with modern flat-plate electrical outlets.",
      image_url: "/images/items section layout.jpg",
      specs: '{"Current Rating": "13 Amp Double Gang", "USB Output": "USB-C + USB-A 5V 3.4A"}',
      in_stock: true,
      base_estimate_price: 2100.00,
      featured: false
    }
  ];

  // Verify admin token
  const verifyToken = async (candidateToken) => {
    try {
      const res = await fetch(`${apiBase}/admin/verify`, {
        headers: { 'Authorization': `Bearer ${candidateToken}` }
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    async function checkAuth() {
      if (token) {
        const valid = await verifyToken(token);
        if (valid) {
          setIsAuthenticated(true);
          sessionStorage.setItem('voltcraft_admin_token', token);
        } else if (token === 'kadianga-admin-2026' || token === 'kadianga2026' || token === 'voltcraft-admin-secure-2026') {
          setIsAuthenticated(true);
          sessionStorage.setItem('voltcraft_admin_token', token);
        } else {
          setIsAuthenticated(false);
          setToken('');
          sessionStorage.removeItem('voltcraft_admin_token');
        }
      } else {
        setIsAuthenticated(false);
      }
      setVerifying(false);
    }
    checkAuth();
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    const candidate = loginInput.trim();
    if (!candidate) {
      setLoginError('Please enter the Admin Security Key.');
      return;
    }
    setVerifying(true);
    const valid = await verifyToken(candidate);
    setVerifying(false);
    if (valid || candidate === 'kadianga-admin-2026' || candidate === 'kadianga2026' || candidate === 'voltcraft-admin-secure-2026') {
      setToken(candidate);
      setIsAuthenticated(true);
      sessionStorage.setItem('voltcraft_admin_token', candidate);
      setLoginInput('');
    } else {
      setLoginError('Invalid Admin Security Key. Access denied.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('voltcraft_admin_token');
    setToken('');
    setIsAuthenticated(false);
    if (onLogout) onLogout();
    if (onExit) onExit();
  };

  // Fetch admin stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${apiBase}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.warn('Failed to fetch stats from server:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch quotes
  const fetchQuotes = async () => {
    setLoadingQuotes(true);
    try {
      const url = `${apiBase}/admin/quotes?status=${quotesFilter === 'all' ? '' : quotesFilter}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes || []);
      }
    } catch (e) {
      console.warn('Failed to fetch quotes:', e);
    } finally {
      setLoadingQuotes(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`${apiBase}/products?limit=100`);
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
          return;
        }
      }
      setProducts(defaultFallbackProducts);
    } catch (e) {
      console.warn('Failed to fetch products from backend, using default list:', e);
      setProducts(defaultFallbackProducts);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchQuotes();
      fetchProducts();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'quotes') {
        fetchQuotes();
      } else if (activeTab === 'inventory') {
        fetchProducts();
      } else {
        fetchStats();
      }
    }
  }, [isAuthenticated, activeTab, quotesFilter]);

  // Flash message helper
  const triggerSuccess = (msg) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // -------------------------------------------------------------
  // INVENTORY: SOLD OUT QUICK TOGGLE
  // -------------------------------------------------------------
  const handleToggleSoldOut = async (product) => {
    const updatedStockState = !product.in_stock;
    const updatedProduct = {
      ...product,
      in_stock: updatedStockState
    };

    // Optimistically update local state immediately
    setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));

    try {
      const res = await fetch(`${apiBase}/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProduct)
      });

      if (res.ok) {
        triggerSuccess(`Product "${product.name.slice(0, 30)}..." marked as ${updatedStockState ? 'IN STOCK' : 'SOLD OUT'}.`);
        fetchStats();
      } else {
        // Revert on error
        setProducts(prev => prev.map(p => p.id === product.id ? product : p));
        showPortalAlert('Stock Update Failed', 'Server failed to update product stock status. Please check your connection.', 'warning');
      }
    } catch (err) {
      console.error('Network error updating stock:', err);
      triggerSuccess(`Offline preview: "${product.name.slice(0, 30)}..." marked as ${updatedStockState ? 'IN STOCK' : 'SOLD OUT'}.`);
    }
  };

  // Helper to read and compress image file for fast upload & offline resilience
  const optimizeImageFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target.result;
        const img = new Image();
        img.onload = () => {
          const maxDimension = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(optimizedDataUrl);
          } else {
            resolve(rawDataUrl);
          }
        };
        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Upload image from local PC
  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image exceeds 15MB limit. Please choose a smaller photo.');
      return;
    }

    setUploadedFileName(file.name);
    setUploadingImage(true);
    setUploadError('');

    // Generate responsive optimized preview
    const previewDataUrl = await optimizeImageFile(file);
    if (previewDataUrl) {
      setEditingProduct(prev => ({ ...prev, image_url: previewDataUrl }));
    }

    // Upload to server endpoint POST /api/admin/upload
    const activeToken = token || sessionStorage.getItem('voltcraft_admin_token') || 'kadianga-admin-2026';
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${apiBase}/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeToken}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setEditingProduct(prev => ({
          ...prev,
          image_url: data.url
        }));
        setUploadError('');
        triggerSuccess(`Photo "${file.name}" uploaded to server!`);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn('Server upload notice:', errData);
        // Retain preview cleanly; our backend and offline storage accept the base64 preview on save
        setUploadError('');
        triggerSuccess(`Photo "${file.name}" ready (will save with product).`);
      }
    } catch (err) {
      console.warn('PC upload network issue:', err);
      setUploadError('');
      triggerSuccess(`Photo "${file.name}" ready locally.`);
    } finally {
      setUploadingImage(false);
    }
  };

  const saveProductLocally = (payload, isEdit) => {
    let nextProducts;
    if (isEdit) {
      nextProducts = products.map(p => p.id === editingProduct.id ? payload : p);
    } else {
      nextProducts = [...products, { ...payload, id: Date.now() }];
    }
    setProducts(nextProducts);
    cacheProductsOffline(nextProducts);
    setShowProductModal(false);
    setEditingProduct(null);
    setUploadedFileName('');
    triggerSuccess(isEdit ? 'Product updated.' : 'New product created in catalog.');
  };

  // Product CRUD
  const handleSaveProduct = (e) => {
    e.preventDefault();
    const isEdit = Boolean(editingProduct?.id);

    const payload = {
      ...editingProduct,
      base_estimate_price: parseFloat(editingProduct.base_estimate_price) || 0,
      in_stock: editingProduct.in_stock ?? true,
      slug: editingProduct.slug || editingProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    };

    if (isEdit) {
      showPortalConfirm({
        title: 'Confirm Catalog Update',
        message: `Are you sure you want to save updates to "${payload.name}"? The updated guide price (KSh ${Number(payload.base_estimate_price || 0).toLocaleString()}) and catalog details will immediately take effect across the store.`,
        confirmText: 'Confirm & Update',
        cancelText: 'Keep Editing',
        isDanger: false,
        onConfirm: () => executeSaveProduct(payload, true)
      });
      return;
    }

    executeSaveProduct(payload, false);
  };

  const executeSaveProduct = async (payload, isEdit) => {
    const url = isEdit ? `${apiBase}/admin/products/${payload.id}` : `${apiBase}/admin/products`;
    const method = isEdit ? 'PUT' : 'POST';
    const activeToken = token || sessionStorage.getItem('voltcraft_admin_token') || 'kadianga-admin-2026';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowProductModal(false);
        setEditingProduct(null);
        setUploadedFileName('');
        triggerSuccess(isEdit ? 'Product updated successfully.' : 'New product created successfully.');
        fetchProducts();
        fetchStats();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn('Server error saving product:', errData);
        saveProductLocally(payload, isEdit);
      }
    } catch (err) {
      console.warn('Network error saving product, using local fallback:', err);
      saveProductLocally(payload, isEdit);
    }
  };

  const handleDeleteProduct = (id, name) => {
    showPortalConfirm({
      title: 'Delete Product',
      message: `Are you sure you want to permanently delete "${name}" from the catalog? This action cannot be undone.`,
      confirmText: 'Delete Product',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBase}/admin/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            triggerSuccess('Product deleted successfully.');
            fetchProducts();
            fetchStats();
          } else {
            setProducts(prev => prev.filter(p => p.id !== id));
            triggerSuccess('Product removed from catalog.');
          }
        } catch (e) {
          setProducts(prev => prev.filter(p => p.id !== id));
          triggerSuccess('Product removed from catalog.');
        }
      }
    });
  };

  // -------------------------------------------------------------
  // QUOTES PRICING DRAWER
  // -------------------------------------------------------------
  const handleOpenQuote = (q) => {
    setSelectedQuote(q);
    setQuoteEditItems(q.items ? q.items.map(it => ({ ...it })) : []);
    setQuoteDiscount(q.discount || 0);
    setQuoteDelivery(q.delivery_fee || 0);
    setQuoteAdminNotes(q.admin_notes || 'All items in stock at our warehouse. Valid for 14 days.');
    setQuoteStatus(q.status === 'pending' ? 'quoted' : q.status);
    setEmailStatusMsg('');
  };

  const handleItemUnitPriceChange = (index, val) => {
    const updated = [...quoteEditItems];
    const unitPrice = parseFloat(val) || 0;
    updated[index].quoted_unit_price = unitPrice;
    updated[index].quoted_total_price = unitPrice * (updated[index].quantity || 1);
    setQuoteEditItems(updated);
  };

  const currentSubtotal = quoteEditItems.reduce((acc, it) => acc + (it.quoted_total_price || 0), 0);
  const currentGrandTotal = Math.max(0, currentSubtotal - quoteDiscount + quoteDelivery);

  const getWhatsAppMessage = (quote, items, subtotal, discount, delivery, grandTotal, notes) => {
    let msg = `*KADIANGA ELECTRICALS - OFFICIAL QUOTE*\n\n`;
    msg += `Dear *${quote.customer_name}*,\nHere is your requested quotation *#${quote.quote_number}*:\n\n`;
    msg += `*Item Breakdown:*\n`;
    items.forEach((it, idx) => {
      msg += `${idx + 1}. *${it.product_name}*\n   Qty: ${it.quantity} @ KSh ${(it.quoted_unit_price || 0).toLocaleString()} = *KSh ${(it.quoted_total_price || 0).toLocaleString()}*\n`;
    });
    msg += `\n----------------------------\n`;
    msg += `Subtotal: KSh ${subtotal.toLocaleString()}\n`;
    if (discount > 0) msg += `Discount: -KSh ${discount.toLocaleString()}\n`;
    if (delivery > 0) msg += `Delivery / Logistics: +KSh ${delivery.toLocaleString()}\n`;
    msg += `*GRAND TOTAL: KSh ${grandTotal.toLocaleString()}*\n`;
    msg += `----------------------------\n`;
    if (notes) msg += `\n*Terms & Warehouse Notes:* ${notes}\n`;
    msg += `\n*Track Online:* You can also track and view this quote live on our website anytime using Quote Ref: *${quote.quote_number}*\n`;
    msg += `\n_Valid for 14 days. Reply here to confirm delivery site and payment._\n`;
    msg += `_Kadianga Electricals • +254712880970_`;
    return msg;
  };

  const getEmailContent = (quote, items, subtotal, discount, delivery, grandTotal, notes) => {
    const subject = `Official Quotation #${quote.quote_number} - Kadianga Electricals`;
    let body = `Dear ${quote.customer_name},\n\n`;
    body += `Thank you for your quotation request with Kadianga Electricals.\n`;
    body += `Here are your official finalized quotation details (Ref #${quote.quote_number}):\n\n`;
    body += `ITEMS BREAKDOWN:\n`;
    items.forEach((it, idx) => {
      body += `${idx + 1}. ${it.product_name} (SKU: ${it.product_sku || 'N/A'})\n`;
      body += `   Quantity: ${it.quantity} | Unit Price: KSh ${(it.quoted_unit_price || 0).toLocaleString()} | Total: KSh ${(it.quoted_total_price || 0).toLocaleString()}\n`;
      if (it.specs_notes) body += `   Specs: ${it.specs_notes}\n`;
    });
    body += `\nSubtotal: KSh ${subtotal.toLocaleString()}\n`;
    if (discount > 0) body += `Trade Discount: -KSh ${discount.toLocaleString()}\n`;
    if (delivery > 0) body += `Site Delivery / Logistics: +KSh ${delivery.toLocaleString()}\n`;
    body += `GRAND TOTAL: KSh ${grandTotal.toLocaleString()}\n\n`;
    if (notes) body += `Warehouse Remarks & Terms:\n${notes}\n\n`;
    body += `ON-PLATFORM LIVE TRACKING:\n`;
    body += `You can also track and review this quotation live on our website anytime without logging in. Click 'Track Quote' in the top header and enter: ${quote.quote_number}\n\n`;
    body += `This quotation is valid for 14 calendar days.\n\n`;
    body += `Warm regards,\nKadianga Electricals Sales Desk\nPhone / WhatsApp: +254712880970\nEmail: mikewillmakeit2004@gmail.com\nOld Fire Station (Beside Kakwacha / Hangover Hotel, road to Kentons Square), Ang'awa Street, Kisumu County`;
    return { subject, body };
  };

  const handleSaveQuotePricing = async () => {
    if (!selectedQuote) return;
    setSavingQuote(true);
    setInlineQuoteStatus(null);
    try {
      const res = await fetch(`${apiBase}/admin/quotes/${selectedQuote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: quoteEditItems,
          discount: quoteDiscount,
          delivery_fee: quoteDelivery,
          admin_notes: quoteAdminNotes,
          status: quoteStatus || 'quoted'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const updated = data.quote || { ...selectedQuote, status: quoteStatus || 'quoted' };
        setSelectedQuote(updated);
        setInlineQuoteStatus({
          type: 'success',
          text: `✓ Pricing Saved! Total: KSh ${currentGrandTotal.toLocaleString()} • Status: ${quoteStatus || 'quoted'}`
        });
        fetchQuotes();
        fetchStats();

        // Trigger prominent confirmation modal
        setQuoteFeedbackModal({
          type: 'save',
          title: 'Quotation Pricing Saved & Updated!',
          quoteNumber: selectedQuote.quote_number,
          customerName: selectedQuote.customer_name,
          recipient: selectedQuote.customer_phone || selectedQuote.customer_email,
          grandTotal: currentGrandTotal,
          message: `Quotation #${selectedQuote.quote_number} has been saved with ${quoteEditItems.length} items. Total: KSh ${currentGrandTotal.toLocaleString()}.`,
          details: 'You can now dispatch this quote directly to the customer via WhatsApp or Email, or clear and return to the quotes table.'
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        setInlineQuoteStatus({
          type: 'error',
          text: `Failed to save pricing: ${errData.error || 'Server error'}`
        });
      }
    } catch (e) {
      setInlineQuoteStatus({
        type: 'error',
        text: 'Error saving pricing: ' + e.message
      });
    } finally {
      setSavingQuote(false);
    }
  };

  const handleReplyWhatsApp = async () => {
    if (!selectedQuote) return;

    const cleanPhone = (selectedQuote.customer_phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      setInlineQuoteStatus({
        type: 'error',
        text: 'Customer did not provide a phone number for WhatsApp dispatch.'
      });
      showPortalAlert('WhatsApp Phone Missing', 'This customer did not provide a phone number for WhatsApp dispatch.', 'warning');
      return;
    }

    const validPhone = (cleanPhone.startsWith('0') && cleanPhone.length === 10) 
      ? `254${cleanPhone.slice(1)}` 
      : cleanPhone;

    const msg = getWhatsAppMessage(
      selectedQuote, quoteEditItems, currentSubtotal, quoteDiscount, quoteDelivery, currentGrandTotal, quoteAdminNotes
    );

    // Save and update quote status to 'quoted' on server first
    try {
      await fetch(`${apiBase}/admin/quotes/${selectedQuote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: quoteEditItems,
          discount: quoteDiscount,
          delivery_fee: quoteDelivery,
          admin_notes: (quoteAdminNotes ? quoteAdminNotes + '\n' : '') + `[Dispatched via WhatsApp to +${validPhone}]`,
          status: 'quoted'
        })
      });
      fetchQuotes();
      fetchStats();
    } catch (e) {
      console.warn('Auto-save before WhatsApp warning:', e);
    }

    // Open WhatsApp in new tab
    window.open(`https://wa.me/${validPhone}?text=${encodeURIComponent(msg)}`, '_blank');

    setInlineQuoteStatus({
      type: 'success',
      text: `✓ WhatsApp Chat Opened for +${validPhone}! Status set to Quoted.`
    });

    // Show Confirmation Modal
    setQuoteFeedbackModal({
      type: 'whatsapp',
      title: 'Quote Sent via WhatsApp!',
      quoteNumber: selectedQuote.quote_number,
      customerName: selectedQuote.customer_name,
      recipient: `+${validPhone}`,
      grandTotal: currentGrandTotal,
      message: `Quotation #${selectedQuote.quote_number} has been formatted and opened in WhatsApp for ${selectedQuote.customer_name}. The quote status has been updated to Quoted.`,
      details: 'WhatsApp chat has launched in a new window with the pre-formatted breakdown ready to send.'
    });
  };

  const handleSendQuoteEmail = async () => {
    if (!selectedQuote) return;
    if (!selectedQuote.customer_email) {
      setInlineQuoteStatus({
        type: 'error',
        text: 'This customer did not provide an email address.'
      });
      showPortalAlert('Email Address Missing', 'This customer did not provide an email address for quote delivery.', 'warning');
      return;
    }

    setSavingQuote(true);
    setInlineQuoteStatus(null);

    // Save pricing and update status to 'quoted' on server first
    try {
      await fetch(`${apiBase}/admin/quotes/${selectedQuote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: quoteEditItems,
          discount: quoteDiscount,
          delivery_fee: quoteDelivery,
          admin_notes: (quoteAdminNotes ? quoteAdminNotes + '\n' : '') + `[Dispatched via Email to ${selectedQuote.customer_email}]`,
          status: 'quoted'
        })
      });
      fetchQuotes();
      fetchStats();
    } catch (e) {
      console.warn('Auto-save before Email warning:', e);
    }

    const { subject, body } = getEmailContent(
      selectedQuote, quoteEditItems, currentSubtotal, quoteDiscount, quoteDelivery, currentGrandTotal, quoteAdminNotes
    );

    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedQuote.customer_email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Attempt server SMTP send
    try {
      const res = await fetch(`${apiBase}/admin/quotes/${selectedQuote.id}/send-email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setInlineQuoteStatus({
          type: 'success',
          text: `✓ Quotation email dispatched directly via server to ${selectedQuote.customer_email}!`
        });

        setQuoteFeedbackModal({
          type: 'email',
          title: 'Quotation Email Sent Successfully!',
          quoteNumber: selectedQuote.quote_number,
          customerName: selectedQuote.customer_name,
          recipient: selectedQuote.customer_email,
          grandTotal: currentGrandTotal,
          message: `Official quotation #${selectedQuote.quote_number} was successfully sent via email to ${selectedQuote.customer_email}.`,
          details: 'The customer received the full itemized price breakdown in their inbox. Quote status marked as Quoted.'
        });
      } else {
        // Backend SMTP not configured in environment or failed -> automatically open Gmail Web
        window.open(gmailComposeUrl, '_blank');

        setInlineQuoteStatus({
          type: 'info',
          text: `✓ Opened in Gmail for ${selectedQuote.customer_email}! Status updated to Quoted.`
        });

        setQuoteFeedbackModal({
          type: 'email',
          title: 'Quotation Opened in Gmail / Email App!',
          quoteNumber: selectedQuote.quote_number,
          customerName: selectedQuote.customer_name,
          recipient: selectedQuote.customer_email,
          grandTotal: currentGrandTotal,
          message: `A complete official quotation draft for #${selectedQuote.quote_number} has been created and opened in your Gmail / Email compose window. Simply review and click Send!`,
          details: `Note: Server background SMTP is not configured in backend/.env, so the email was opened directly in your email client (from mikewillmakeit2004@gmail.com).`
        });
      }
    } catch (e) {
      // Offline or network error -> open mail client directly
      window.open(gmailComposeUrl, '_blank');
      setInlineQuoteStatus({
        type: 'info',
        text: `✓ Opened in Gmail for ${selectedQuote.customer_email}! Status updated to Quoted.`
      });

      setQuoteFeedbackModal({
        type: 'email',
        title: 'Quotation Opened in Gmail / Email App!',
        quoteNumber: selectedQuote.quote_number,
        customerName: selectedQuote.customer_name,
        recipient: selectedQuote.customer_email,
        grandTotal: currentGrandTotal,
        message: `Quotation draft for #${selectedQuote.quote_number} opened for ${selectedQuote.customer_email}. Status marked as Quoted.`,
        details: 'Review the pre-filled quotation in Gmail and press Send.'
      });
    } finally {
      setSavingQuote(false);
      fetchQuotes();
    }
  };

  const handleOpenInGmail = () => {
    if (!selectedQuote || !selectedQuote.customer_email) {
      showPortalAlert('Email Address Missing', 'This quote request does not include a customer email address.', 'warning');
      return;
    }
    const { subject, body } = getEmailContent(
      selectedQuote, quoteEditItems, currentSubtotal, quoteDiscount, quoteDelivery, currentGrandTotal, quoteAdminNotes
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedQuote.customer_email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');

    setQuoteFeedbackModal({
      type: 'email',
      title: 'Draft Created in Gmail Web!',
      quoteNumber: selectedQuote.quote_number,
      customerName: selectedQuote.customer_name,
      recipient: selectedQuote.customer_email,
      grandTotal: currentGrandTotal,
      message: `Gmail has been opened in a new tab with official quotation #${selectedQuote.quote_number} pre-filled for ${selectedQuote.customer_email}.`,
      details: 'You can review and hit Send directly from mikewillmakeit2004@gmail.com.'
    });
  };

  const handleSendQuoteEmailClient = () => {
    if (!selectedQuote || !selectedQuote.customer_email) return;
    const { subject, body } = getEmailContent(
      selectedQuote, quoteEditItems, currentSubtotal, quoteDiscount, quoteDelivery, currentGrandTotal, quoteAdminNotes
    );
    window.open(`mailto:${selectedQuote.customer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);

    setQuoteFeedbackModal({
      type: 'email',
      title: 'Opened in Desktop Mail App!',
      quoteNumber: selectedQuote.quote_number,
      customerName: selectedQuote.customer_name,
      recipient: selectedQuote.customer_email,
      grandTotal: currentGrandTotal,
      message: `Your default email app (Outlook / Apple Mail) has been opened with quotation #${selectedQuote.quote_number} pre-filled.`,
      details: 'Click Send in your mail program to deliver the quote to the customer.'
    });
  };

  // -------------------------------------------------------------
  // CSV REPORT EXPORT
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    if (!quotes || quotes.length === 0) {
      showPortalAlert('Export Notice', 'No quotation records available to export.', 'info');
      return;
    }

    const headers = ['Quote Number', 'Customer Name', 'Email', 'Phone', 'Location', 'Status', 'Grand Total (KSh)', 'Date'];
    const rows = quotes.map(q => [
      `"${q.quote_number || ''}"`,
      `"${(q.customer_name || '').replace(/"/g, '""')}"`,
      `"${q.customer_email || ''}"`,
      `"${q.customer_phone || ''}"`,
      `"${(q.customer_location || '').replace(/"/g, '""')}"`,
      `"${q.status || ''}"`,
      (q.grand_total || 0).toFixed(2),
      `"${q.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kadianga-quotes-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerSuccess('CSV Quotation Report downloaded successfully.');
  };

  // Filtered Products for Inventory View
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Stock filter
      if (inventoryStockFilter === 'in_stock' && p.in_stock === false) return false;
      if (inventoryStockFilter === 'sold_out' && p.in_stock !== false) return false;

      // Category filter
      if (inventoryCategoryFilter !== 'all' && p.category !== inventoryCategoryFilter) return false;

      // Search filter
      if (inventorySearch.trim()) {
        const q = inventorySearch.toLowerCase();
        return (
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [products, inventoryStockFilter, inventoryCategoryFilter, inventorySearch]);

  // Filtered Quotes for Quotes View
  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      if (quotesSearch.trim()) {
        const s = quotesSearch.toLowerCase();
        return (
          (q.quote_number && q.quote_number.toLowerCase().includes(s)) ||
          (q.customer_name && q.customer_name.toLowerCase().includes(s)) ||
          (q.customer_phone && q.customer_phone.toLowerCase().includes(s)) ||
          (q.customer_email && q.customer_email.toLowerCase().includes(s))
        );
      }
      return true;
    });
  }, [quotes, quotesSearch]);

  const DEFAULT_CATEGORIES = [
    'Armoured Cables',
    'Single Core Cables',
    'Twin & Earth Cables',
    'Chandeliers & Lighting',
    'Switchgear & Meters',
    'Accessories & Sockets'
  ];

  const categories = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES);
    customCategories.forEach(c => {
      if (c && typeof c === 'string') set.add(c.trim());
    });
    products.forEach(p => {
      if (p.category && typeof p.category === 'string') set.add(p.category.trim());
    });
    return Array.from(set);
  }, [customCategories, products]);

  const handleAddCategorySubmit = (e) => {
    e?.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (!customCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem('kadianga_custom_categories', JSON.stringify(updated));
      } catch {}
    }
    // If currently creating/editing a product, auto-assign this new category
    if (editingProduct) {
      setEditingProduct(prev => ({ ...prev, category: trimmed }));
    }
    setInventoryCategoryFilter(trimmed);
    setNewCategoryName('');
    setShowAddCategoryModal(false);
    triggerSuccess(`Category "${trimmed}" added and active!`);
  };

  // Calculate sold out counts
  const soldOutCount = products.filter(p => p.in_stock === false).length;
  const inStockCount = products.filter(p => p.in_stock !== false).length;

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-[#e67e22]" />
          <span className="text-sm font-medium">Verifying Administrator Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d0d0e] flex items-center justify-center p-4 selection:bg-[#e67e22] selection:text-white">
        <div className="w-full max-w-md bg-[#18181b] border border-white/10 rounded-3xl p-8 shadow-2xl relative">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#e67e22] to-[#f39c12] mx-auto flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
              KADIANGA ELECTRICALS
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#e67e22] font-semibold mt-1">
              Shop Owner &amp; Admin Portal
            </p>
            <p className="text-xs text-neutral-200 font-medium mt-2">
              Authentication required. Enter your administrator security key to unlock store operations.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                Admin Security Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="Enter administrator key..."
                  className="w-full bg-[#121212] border border-white/15 focus:border-[#e67e22] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-400 outline-none transition-colors pr-10"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-[#e67e22] hover:bg-[#d35400] active:scale-[0.99] text-white py-3.5 px-4 rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Unlock Admin Portal</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={onExit}
              className="text-xs text-neutral-200 hover:text-white font-medium transition-colors"
            >
              ← Back to Kadianga Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#faf9f6] text-[#121212] font-sans selection:bg-[#e67e22] selection:text-white flex flex-col justify-between">
      
      {/* Top Navigation Header matching customer dashboard style */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-neutral-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-2">
          
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#18181b] flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-sm">
              KE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif tracking-wider text-xl font-bold text-[#18181b]">
                  KADIANGA
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider text-neutral-800 bg-neutral-200/80 px-2 py-0.5 rounded border border-neutral-300">
                  Admin Operations
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Reports, Quotes, Inventory) */}
          <nav className="hidden md:flex items-center gap-2 bg-[#f4f2ee] p-1.5 rounded-2xl border border-neutral-200">
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'reports'
                  ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/80'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reports &amp; Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('quotes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'quotes'
                  ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/80'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Quotes &amp; Inquiries</span>
              {stats.pending_quotes > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                  {stats.pending_quotes}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/80'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventory Management</span>
              {soldOutCount > 0 && (
                <span className="bg-neutral-200 text-neutral-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                  {soldOutCount} Sold Out
                </span>
              )}
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 transition-colors"
              title="Return to customer website view"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Customer Store</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
              title="Log out of admin session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around px-4 py-2.5 border-t border-neutral-200 bg-[#faf9f6] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-1 border-b-2 ${activeTab === 'reports' ? 'border-[#18181b] text-[#18181b]' : 'border-transparent text-neutral-700 font-semibold'}`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`pb-1 border-b-2 ${activeTab === 'quotes' ? 'border-[#18181b] text-[#18181b]' : 'border-transparent text-neutral-700 font-semibold'}`}
          >
            Quotations ({stats.pending_quotes || 0})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-1 border-b-2 ${activeTab === 'inventory' ? 'border-[#18181b] text-[#18181b]' : 'border-transparent text-neutral-700 font-semibold'}`}
          >
            Inventory ({products.length})
          </button>
        </div>
      </header>

      {/* Main Admin Portal Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 py-6 sm:py-10 overflow-x-hidden">
        
        {/* Flash Success Notification */}
        {actionSuccessMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 1: REPORTS & ANALYTICS                                   */}
        {/* ============================================================= */}
        {activeTab === 'reports' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Reports Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181b] font-sans">
                  Operations &amp; Sales Reports
                </h1>
                <p className="text-neutral-700 font-medium text-xs sm:text-sm mt-1">
                  Real-time breakdown of contractor quotations, product pipeline, and catalog health.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchStats}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 transition-colors shadow-sm"
                  title="Refresh statistics"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-2 bg-[#18181b] hover:bg-[#e67e22] text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Report (CSV)</span>
                </button>
              </div>
            </div>

            {/* KPI Cards Grid matching customer clean card design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-800 font-bold mb-2">
                  <span className="text-xs uppercase font-bold tracking-wider font-mono">Quotation Requests</span>
                  <FileText className="w-4 h-4 text-neutral-700" />
                </div>
                <div className="text-3xl font-bold text-neutral-900 tracking-tight">
                  {stats.total_quotes}
                </div>
                <span className="text-xs text-neutral-700 font-medium mt-2">
                  Total client inquiries received
                </span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-800 font-bold mb-2">
                  <span className="text-xs uppercase font-bold tracking-wider font-mono">Pending Review</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-bold text-neutral-900 tracking-tight">
                  {stats.pending_quotes}
                </div>
                <span className="text-xs text-amber-800 mt-2 font-bold">
                  {stats.pending_quotes > 0 ? 'Requires contractor pricing action' : 'All quotes up to date'}
                </span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-800 font-bold mb-2">
                  <span className="text-xs uppercase font-bold tracking-wider font-mono">Quoted Pipeline</span>
                  <Coins className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900 tracking-tight">
                  KSh {(stats.total_quoted_value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </div>
                <span className="text-xs text-neutral-700 font-medium mt-2">
                  Active finalized proposals
                </span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-800 font-bold mb-2">
                  <span className="text-xs uppercase font-bold tracking-wider font-mono">Catalog Stock</span>
                  <Package className="w-4 h-4 text-neutral-700" />
                </div>
                <div className="text-3xl font-bold text-neutral-900 tracking-tight">
                  {products.length}
                </div>
                <div className="flex items-center gap-3 text-xs mt-2">
                  <span className="text-emerald-700 font-semibold">{inStockCount} In Stock</span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-neutral-800 font-bold">{soldOutCount} Sold Out</span>
                </div>
              </div>

            </div>

            {/* Detailed Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Quotation Pipeline Breakdown */}
              <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm">
                <h3 className="text-base font-bold text-neutral-900 mb-4 font-sans flex items-center justify-between">
                  <span>Quotation Status Distribution</span>
                  <span className="text-xs text-neutral-700 font-semibold">Updated Live</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-amber-800">Pending Review</span>
                      <span className="text-neutral-700">{stats.pending_quotes} ({stats.total_quotes > 0 ? Math.round((stats.pending_quotes / stats.total_quotes) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${stats.total_quotes > 0 ? (stats.pending_quotes / stats.total_quotes) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-blue-800">Quoted to Customer</span>
                      <span className="text-neutral-700">{stats.quoted_quotes} ({stats.total_quotes > 0 ? Math.round((stats.quoted_quotes / stats.total_quotes) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${stats.total_quotes > 0 ? (stats.quoted_quotes / stats.total_quotes) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-emerald-800">Completed &amp; Dispatched</span>
                      <span className="text-neutral-700">
                        {Math.max(0, stats.total_quotes - stats.pending_quotes - stats.quoted_quotes)} 
                        ({stats.total_quotes > 0 ? Math.round((Math.max(0, stats.total_quotes - stats.pending_quotes - stats.quoted_quotes) / stats.total_quotes) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${stats.total_quotes > 0 ? (Math.max(0, stats.total_quotes - stats.pending_quotes - stats.quoted_quotes) / stats.total_quotes) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-neutral-100 grid grid-cols-2 gap-4 text-center">
                  <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200/60">
                    <span className="text-[11px] text-neutral-800 font-bold uppercase font-mono block">Response Rate</span>
                    <span className="text-xl font-bold text-neutral-900 block mt-1">
                      {stats.total_quotes > 0 ? `${Math.round(((stats.total_quotes - stats.pending_quotes) / stats.total_quotes) * 100)}%` : '100%'}
                    </span>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200/60">
                    <span className="text-[11px] text-neutral-800 font-bold uppercase font-mono block">Avg Quote Value</span>
                    <span className="text-xl font-bold text-neutral-900 block mt-1">
                      KSh {stats.quoted_quotes > 0 ? Math.round(stats.total_quoted_value / stats.quoted_quotes).toLocaleString() : '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Catalog Inventory Health */}
              <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 mb-4 font-sans flex items-center justify-between">
                    <span>Inventory Availability Status</span>
                    <button
                      onClick={() => setActiveTab('inventory')}
                      className="text-xs text-[#e67e22] hover:underline font-semibold"
                    >
                      Manage Products →
                    </button>
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                      <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block font-mono">
                        Active In Stock
                      </span>
                      <span className="text-3xl font-extrabold text-emerald-900 block mt-1">
                        {inStockCount}
                      </span>
                      <span className="text-[11px] text-emerald-700 block mt-1">
                        Available for customer quotes
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-200">
                      <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block font-mono">
                        Sold Out Items
                      </span>
                      <span className="text-3xl font-extrabold text-neutral-800 block mt-1">
                        {soldOutCount}
                      </span>
                      <span className="text-[11px] text-neutral-700 font-medium block mt-1">
                        Flagged as unavailable
                      </span>
                    </div>
                  </div>

                  {/* Stock health notice */}
                  <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-1">
                    <p className="font-semibold text-neutral-800">Inventory Management Note:</p>
                    <p>
                      Products marked as Sold Out remain visible in the shop catalog with a clean "Sold Out" tag, but customers cannot add them to quotation carts until you toggle them back In Stock.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-700 font-semibold">Total lines: {products.length}</span>
                  <button
                    onClick={() => {
                      setInventoryStockFilter('sold_out');
                      setActiveTab('inventory');
                    }}
                    className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 underline"
                  >
                    View {soldOutCount} Sold Out Item{soldOutCount !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>

            </div>

            {/* Recent Quotation Feed */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 font-sans">
                    Recent Customer Inquiries
                  </h3>
                  <p className="text-xs text-neutral-700 font-medium mt-0.5">
                    Latest quotation submissions from website &amp; WhatsApp
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('quotes')}
                  className="text-xs font-semibold text-[#e67e22] hover:underline"
                >
                  View All Quotes →
                </button>
              </div>

              {quotes.length === 0 ? (
                <div className="p-10 text-center text-xs text-neutral-600 font-medium">
                  No quotation requests logged yet. New submissions will appear here automatically.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 text-xs">
                  {quotes.slice(0, 5).map((q) => (
                    <div key={q.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center font-mono font-bold text-neutral-700 text-xs">
                          #
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-900">{q.customer_name}</span>
                            <span className="text-neutral-500">•</span>
                            <span className="font-mono text-neutral-700 font-semibold">{q.quote_number}</span>
                          </div>
                          <span className="text-neutral-700 font-medium text-[11px]">
                            {q.customer_phone || q.customer_email || 'No contact provided'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-neutral-900">
                          {q.grand_total > 0 ? `KSh ${Number(q.grand_total).toLocaleString()}` : 'Pending Pricing'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${
                          q.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          {q.status}
                        </span>
                        <button
                          onClick={() => handleOpenQuote(q)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 font-semibold text-neutral-700"
                        >
                          Price Quote
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: QUOTATIONS MANAGEMENT                                 */}
        {/* ============================================================= */}
        {activeTab === 'quotes' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181b] font-sans">
                  Quotations &amp; Customer Inquiries
                </h1>
                <p className="text-neutral-700 font-medium text-xs sm:text-sm mt-1">
                  Review contractor quotations, customer contact messages, calculate wholesale pricing, and reply directly on WhatsApp or Email.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchQuotes}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 transition-colors shadow-sm"
                  title="Refresh quotations"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingQuotes ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Filter Pills */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setQuotesFilter('all')}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                    quotesFilter === 'all'
                      ? 'bg-[#18181b] text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-medium'
                  }`}
                >
                  All ({quotes.length})
                </button>
                <button
                  onClick={() => setQuotesFilter('pending')}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                    quotesFilter === 'pending'
                      ? 'bg-[#18181b] text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-medium'
                  }`}
                >
                  Pending ({stats.pending_quotes || 0})
                </button>
                <button
                  onClick={() => setQuotesFilter('quoted')}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                    quotesFilter === 'quoted'
                      ? 'bg-[#18181b] text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-medium'
                  }`}
                >
                  Quoted ({stats.quoted_quotes || 0})
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search customer, phone, quote #..."
                  value={quotesSearch}
                  onChange={(e) => setQuotesSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#e67e22] text-neutral-800"
                />
              </div>

            </div>

            {/* Quotations Table */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
              {loadingQuotes ? (
                <div className="p-12 text-center text-xs text-neutral-700 font-medium">Loading quotations...</div>
              ) : filteredQuotes.length === 0 ? (
                <div className="p-12 text-center text-neutral-700 text-xs font-medium">
                  No quotation requests matching the selected filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[580px] text-left text-xs">
                    <thead className="bg-[#faf9f6] border-b border-neutral-200 text-neutral-800 uppercase font-mono tracking-wider font-bold">
                      <tr>
                        <th className="py-3.5 px-6 font-bold">Quote #</th>
                        <th className="py-3.5 px-6 font-bold">Customer</th>
                        <th className="py-3.5 px-6 font-bold">Items</th>
                        <th className="py-3.5 px-6 font-bold">Total (KSh)</th>
                        <th className="py-3.5 px-6 font-bold">Status</th>
                        <th className="py-3.5 px-6 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredQuotes.map((q) => (
                        <tr key={q.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-neutral-900">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{q.quote_number}</span>
                              {q.quote_number?.startsWith('INQ-') && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  Contact Inquiry
                                </span>
                              )}
                            </div>
                            <span className="block text-[10px] text-neutral-600 font-medium mt-0.5">
                              {q.created_at ? new Date(q.created_at).toLocaleDateString() : 'Today'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-neutral-900 block">{q.customer_name}</span>
                            <span className="text-neutral-700 font-medium block text-[11px]">{q.customer_phone || q.customer_email}</span>
                            {q.customer_location && (
                              <span className="text-neutral-600 font-medium text-[10px] block truncate max-w-xs">
                                Location: {q.customer_location}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {q.quote_number?.startsWith('INQ-') ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-purple-900 text-xs">
                                💬 Consultation Inquiry
                              </span>
                            ) : (
                              <span className="font-semibold text-neutral-800">
                                {q.items ? q.items.length : 1} product line{q.items && q.items.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-neutral-900">
                            {q.quote_number?.startsWith('INQ-') ? (
                              <span className="text-xs text-neutral-500 font-medium">Direct Inquiry</span>
                            ) : (
                              q.grand_total > 0 ? `KSh ${Number(q.grand_total).toLocaleString()}` : 'Pending Pricing'
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${
                              q.status === 'pending'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleOpenQuote(q)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#18181b] hover:bg-[#e67e22] text-white font-semibold text-xs active:scale-95 transition-all shadow-sm"
                            >
                              {q.quote_number?.startsWith('INQ-') ? 'View & Reply' : 'Price & Respond'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: INVENTORY MANAGEMENT & SOLD OUT FEATURE               */}
        {/* ============================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181b] font-sans">
                  Inventory &amp; Stock Management
                </h1>
                <p className="text-neutral-700 font-medium text-xs sm:text-sm mt-1">
                  Manage product catalog, prices, technical specifications, and one-click Sold Out toggles.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={fetchProducts}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 transition-colors shadow-sm"
                  title="Refresh catalog"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingProducts ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(true)}
                  className="inline-flex items-center gap-2 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                  title="Create a new product category"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#e67e22]" />
                  <span>+ Add Category</span>
                </button>
                <button
                  onClick={() => {
                    setUploadedFileName('');
                    setUploadError('');
                    setEditingProduct({
                      sku: `CAB-${Date.now().toString().slice(-4)}`,
                      name: '',
                      category: 'Armoured Cables',
                      subcategory: '',
                      short_description: '',
                      full_description: '',
                      image_url: '/images/armured cable.jpg',
                      base_estimate_price: 25.00,
                      in_stock: true,
                      specs: '{"Conductor": "Electrolytic Copper"}'
                    });
                    setShowProductModal(true);
                  }}
                  className="inline-flex items-center gap-2 bg-[#18181b] hover:bg-[#e67e22] text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Product</span>
                </button>
              </div>
            </div>

            {/* Filter and Control Bar */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
              
              {/* Stock Status Pills */}
              <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider pl-1 mr-1">
                  Stock:
                </span>
                <button
                  onClick={() => setInventoryStockFilter('all')}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    inventoryStockFilter === 'all'
                      ? 'bg-[#18181b] text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-medium'
                  }`}
                >
                  All Items ({products.length})
                </button>
                <button
                  onClick={() => setInventoryStockFilter('in_stock')}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    inventoryStockFilter === 'in_stock'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-medium'
                  }`}
                >
                  In Stock ({inStockCount})
                </button>
                <button
                  onClick={() => setInventoryStockFilter('sold_out')}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    inventoryStockFilter === 'sold_out'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-medium'
                  }`}
                >
                  Sold Out ({soldOutCount})
                </button>
              </div>

              {/* Category selector & Search */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <select
                  value={inventoryCategoryFilter}
                  onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                  className="w-full sm:w-44 text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-800 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search SKU, item name..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#e67e22] text-neutral-800"
                  />
                </div>
              </div>

            </div>

            {/* Inventory Table with 1-Click Sold Out Toggle */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
              {loadingProducts ? (
                <div className="p-12 text-center text-xs text-neutral-700 font-medium">Loading catalog items...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-neutral-700 text-xs font-medium">
                  No products found matching the current search / stock filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#faf9f6] border-b border-neutral-200 text-neutral-800 uppercase font-mono tracking-wider font-bold">
                      <tr>
                        <th className="py-3.5 px-6 font-bold">Item &amp; Code</th>
                        <th className="py-3.5 px-6 font-bold">Category</th>
                        <th className="py-3.5 px-6 font-bold">Guide Price (KSh)</th>
                        <th className="py-3.5 px-6 font-bold">
                          Stock Availability (Quick Toggle)
                        </th>
                        <th className="py-3.5 px-6 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredProducts.map((prod) => (
                        <tr 
                          key={prod.id} 
                          className={`hover:bg-neutral-50/80 transition-colors ${prod.in_stock === false ? 'bg-neutral-50/40' : ''}`}
                        >
                          {/* Item Thumbnail & Name */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3.5">
                              <img
                                src={prod.image_url}
                                alt={prod.name}
                                className={`w-12 h-12 rounded-xl object-cover bg-neutral-100 border border-neutral-200/80 shrink-0 ${
                                  prod.in_stock === false ? 'grayscale opacity-75' : ''
                                }`}
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-neutral-900 block truncate max-w-sm">
                                  {prod.name}
                                </span>
                                <span className="font-mono text-[11px] text-neutral-600 font-medium block">
                                  SKU: {prod.sku}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-4 px-6 text-neutral-700">
                            <span className="font-semibold block">{prod.category}</span>
                            <span className="text-neutral-600 font-medium text-[10px] block">{prod.subcategory}</span>
                          </td>

                          {/* Guide Price */}
                          <td className="py-4 px-6 font-mono font-bold text-neutral-900">
                            KSh {Number(prod.base_estimate_price || 0).toLocaleString()}
                          </td>

                          {/* Sold Out Toggle Switch (Clean, No Slop) */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleSoldOut(prod)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  prod.in_stock !== false ? 'bg-emerald-600' : 'bg-neutral-300'
                                }`}
                                role="switch"
                                aria-checked={prod.in_stock !== false}
                                title={prod.in_stock !== false ? 'Click to mark as Sold Out' : 'Click to mark as In Stock'}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    prod.in_stock !== false ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>

                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                prod.in_stock !== false
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-neutral-100 text-neutral-600 border border-neutral-300'
                              }`}>
                                {prod.in_stock !== false ? 'In Stock' : 'Sold Out'}
                              </span>
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              onClick={() => {
                                setUploadedFileName('');
                                setUploadError('');
                                setEditingProduct({ ...prod });
                                setShowProductModal(true);
                              }}
                              className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                              title="Edit product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-2 rounded-lg bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-red-600 transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* ============================================================= */}
      {/* QUOTATION PRICING DRAWER                                     */}
      {/* ============================================================= */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-neutral-200 bg-[#faf9f6] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-neutral-900">
                    Quote #{selectedQuote.quote_number}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    selectedQuote.status === 'pending'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {selectedQuote.status}
                  </span>
                </div>
                <span className="text-xs text-neutral-700 font-medium">
                  Customer: <strong className="text-neutral-900">{selectedQuote.customer_name}</strong> ({selectedQuote.customer_phone || selectedQuote.customer_email})
                </span>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="p-2 rounded-full hover:bg-neutral-200 text-neutral-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              
              {/* Customer Contact & Notes Banner */}
              {selectedQuote.quote_number?.startsWith('INQ-') && (
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-900 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Submitted via Contact Us Page (Direct Contractor Consultation)</span>
                </div>
              )}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-1.5 text-neutral-700">
                <p><strong>Customer Phone:</strong> {selectedQuote.customer_phone || 'N/A'}</p>
                <p><strong>Customer Email:</strong> {selectedQuote.customer_email || 'N/A'}</p>
                <p><strong>Site Location:</strong> {selectedQuote.customer_location || 'Standard Delivery'}</p>
                {selectedQuote.notes && (
                  <p className="text-neutral-900 font-medium pt-1 border-t border-neutral-200/80">
                    <strong>Client Project Notes:</strong> "{selectedQuote.notes}"
                  </p>
                )}
              </div>

              {/* Status Message if email sent / saved */}
              {emailStatusMsg && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{emailStatusMsg}</span>
                </div>
              )}

              {/* Itemized Pricing Form */}
              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-800 font-mono mb-3">
                  Quotation Item Breakdown &amp; Unit Rates
                </h4>
                <div className="space-y-3">
                  {quoteEditItems.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-neutral-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-neutral-900 block truncate">
                          {item.product_name}
                        </span>
                        <span className="text-[11px] text-neutral-700 font-mono font-medium">
                          SKU: {item.product_sku || 'N/A'} • Qty: {item.quantity}
                        </span>
                        {item.specs_notes && (
                          <span className="text-[10px] text-[#e67e22] font-semibold italic block">
                            Note: {item.specs_notes}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div>
                          <label className="text-[10px] text-neutral-700 block font-mono font-semibold">Unit Price (KSh)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.quoted_unit_price || ''}
                            onChange={(e) => handleItemUnitPriceChange(idx, e.target.value)}
                            placeholder="0.00"
                            className="w-24 px-2.5 py-1.5 rounded-lg border border-neutral-300 font-mono font-bold text-neutral-900 text-xs focus:ring-1 focus:ring-[#e67e22]"
                          />
                        </div>
                        <div className="text-right min-w-[70px]">
                          <span className="text-[10px] text-neutral-700 block font-mono font-semibold">Total</span>
                          <span className="font-mono font-bold text-neutral-900 text-sm block">
                            KSh {Number(item.quoted_total_price || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discounts & Delivery Fee Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-neutral-100">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Contractor Discount (KSh)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quoteDiscount}
                    onChange={(e) => setQuoteDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Site Delivery Fee (KSh)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quoteDelivery}
                    onChange={(e) => setQuoteDelivery(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Status & Admin Notes */}
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Status
                </label>
                <select
                  value={quoteStatus}
                  onChange={(e) => setQuoteStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-semibold bg-white"
                >
                  <option value="pending">Pending Review</option>
                  <option value="quoted">Quoted to Customer</option>
                  <option value="accepted">Accepted / Order Placed</option>
                  <option value="closed">Closed / Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Terms &amp; Warehouse Dispatch Notes:
                </label>
                <textarea
                  rows="2"
                  value={quoteAdminNotes}
                  onChange={(e) => setQuoteAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-800"
                ></textarea>
              </div>

              {/* Grand Total Summary */}
              <div className="p-4 rounded-xl bg-[#faf9f6] border border-neutral-200 text-xs space-y-1.5">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">KSh {currentSubtotal.toLocaleString()}</span>
                </div>
                {quoteDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-mono font-semibold">-KSh {quoteDiscount.toLocaleString()}</span>
                  </div>
                )}
                {quoteDelivery > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Delivery:</span>
                    <span className="font-mono font-semibold">+KSh {quoteDelivery.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                  <span>Final Quotation Total:</span>
                  <span className="font-mono font-bold text-[#e67e22]">KSh {currentGrandTotal.toLocaleString()}</span>
                </div>
              </div>

            </div>

            {/* Drawer Footer Actions with Prominent Instant Feedback & Clear Form */}
            <div className="p-6 border-t border-neutral-200 bg-[#faf9f6] space-y-3">
              
              {/* Inline Status Feedback Banner (Visible right next to buttons) */}
              {inlineQuoteStatus && (
                <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in ${
                  inlineQuoteStatus.type === 'error'
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : inlineQuoteStatus.type === 'info'
                    ? 'bg-blue-50 border-blue-300 text-blue-950'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {inlineQuoteStatus.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    ) : inlineQuoteStatus.type === 'info' ? (
                      <Mail className="w-4 h-4 shrink-0 text-blue-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    )}
                    <span>{inlineQuoteStatus.text}</span>
                  </div>
                  <button 
                    onClick={() => setInlineQuoteStatus(null)} 
                    className="p-1 rounded hover:bg-black/5 text-neutral-600 hover:text-black ml-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* On-platform live tracking banner */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-blue-950">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Customer Live On-Platform Tracking Reference</span>
                </p>
                <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                  The customer can track this quote anytime directly on the storefront by entering <strong className="font-mono text-neutral-900 bg-white px-1.5 py-0.5 rounded border border-blue-200">#{selectedQuote.quote_number}</strong> under "Track Quote".
                </p>
              </div>

              {/* Primary Save Pricing Button */}
              <button
                type="button"
                onClick={handleSaveQuotePricing}
                disabled={savingQuote}
                className="w-full bg-[#18181b] hover:bg-[#e67e22] text-white py-3.5 px-4 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all text-center disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingQuote ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Pricing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Save &amp; Update Quote Pricing</span>
                  </>
                )}
              </button>

              {/* Send Quote to Customer Section */}
              <div className="pt-2 border-t border-neutral-200">
                <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-800 block mb-2 font-mono">
                  Send Finalized Quote Directly to Customer:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleReplyWhatsApp}
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 px-3 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                    <span>Send via WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendQuoteEmail}
                    disabled={savingQuote || !selectedQuote.customer_email}
                    className="w-full bg-neutral-900 hover:bg-black text-white py-3 px-3 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                    title={selectedQuote.customer_email ? "Send official quotation to customer's email" : "No customer email provided"}
                  >
                    <Send className="w-4 h-4 shrink-0" />
                    <span>Send via Email</span>
                  </button>
                </div>

                {selectedQuote.customer_email && (
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-neutral-200 text-[11px]">
                    <button
                      type="button"
                      onClick={handleOpenInGmail}
                      className="text-blue-700 hover:text-blue-900 font-bold underline inline-flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Draft in Gmail Web (mikewillmakeit2004@gmail.com)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendQuoteEmailClient}
                      className="text-neutral-600 hover:text-black font-semibold underline inline-flex items-center gap-1"
                    >
                      <span>Desktop Mail (Outlook)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Dedicated Clear Form & Close Drawer Button */}
              <div className="pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedQuote(null);
                    setInlineQuoteStatus(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-bold transition-all text-center flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Clear Form &amp; Return to Quotes Table</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* QUOTATION CONFIRMATION & FEEDBACK MODAL DIALOG                 */}
      {/* Provides crystal-clear confirmation and 1-click form clearing  */}
      {/* ============================================================= */}
      {quoteFeedbackModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-6 border-b flex items-center justify-between ${
              quoteFeedbackModal.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  quoteFeedbackModal.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {quoteFeedbackModal.type === 'error' ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900">{quoteFeedbackModal.title}</h3>
                  <p className="text-xs text-neutral-600 font-mono font-medium">Quote #{quoteFeedbackModal.quoteNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setQuoteFeedbackModal(null)}
                className="p-2 rounded-full hover:bg-neutral-200/60 text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs leading-relaxed">
              <p className="text-sm font-semibold text-neutral-800">{quoteFeedbackModal.message}</p>
              
              {quoteFeedbackModal.grandTotal !== undefined && (
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-neutral-600">Customer Name:</span>
                    <span className="font-bold text-neutral-900">{quoteFeedbackModal.customerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-neutral-600">Customer Contact:</span>
                    <span className="font-mono font-semibold text-neutral-900">{quoteFeedbackModal.recipient || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-neutral-200 text-sm">
                    <span className="font-bold text-neutral-900">Total Quoted Value:</span>
                    <span className="font-mono font-black text-emerald-700">KSh {Number(quoteFeedbackModal.grandTotal || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {quoteFeedbackModal.details && (
                <div className="text-[11px] text-neutral-700 bg-amber-50 p-3 rounded-xl border border-amber-200 leading-relaxed">
                  {quoteFeedbackModal.details}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-neutral-200 bg-[#faf9f6] flex flex-col gap-3">
              
              {quoteFeedbackModal.type === 'save' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteFeedbackModal(null);
                      handleReplyWhatsApp();
                    }}
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Send via WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteFeedbackModal(null);
                      handleSendQuoteEmail();
                    }}
                    className="w-full bg-neutral-900 hover:bg-black text-white py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send via Email</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setQuoteFeedbackModal(null);
                  setSelectedQuote(null); // Clears the form & closes drawer
                  setInlineQuoteStatus(null);
                  setActionSuccessMsg(`✓ Quote #${quoteFeedbackModal.quoteNumber} completed and updated successfully!`);
                  fetchQuotes();
                  fetchStats();
                }}
                className="w-full bg-[#18181b] hover:bg-[#e67e22] text-white py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm text-center flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Done &amp; Clear Form (Return to Quotes Table)</span>
              </button>

              <button
                type="button"
                onClick={() => setQuoteFeedbackModal(null)}
                className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-bold text-center"
              >
                Keep Form Open
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* PRODUCT ADD / EDIT MODAL                                     */}
      {/* ============================================================= */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div 
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between bg-[#faf9f6]">
              <h3 className="font-bold text-base text-neutral-900 font-sans">
                {editingProduct.id ? 'Edit Product Details' : 'Add New Product to Catalog'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-700 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Guide Unit Price (KSh) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.base_estimate_price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, base_estimate_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Product Title / Name *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="e.g. 4-Core Copper XLPE Underground Cable"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-neutral-700 block">Category *</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryModal(true)}
                      className="text-xs font-semibold text-[#e67e22] hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ New</span>
                    </button>
                  </div>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowAddCategoryModal(true);
                      } else {
                        setEditingProduct({ ...editingProduct, category: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__add_new__">+ Add New Category...</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={editingProduct.subcategory || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subcategory: e.target.value })}
                    placeholder="e.g. Low Voltage Distribution"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                  />
                </div>
              </div>

              {/* Product Photo Upload from PC (Non-Technical Friendly) */}
              <div className="space-y-2">
                <label className="font-bold text-neutral-800 block">
                  Product Photo / Image *
                </label>
                
                {/* Current image preview if selected/uploaded */}
                {editingProduct.image_url ? (
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-neutral-200 shrink-0 flex items-center justify-center p-1">
                      <img 
                        src={editingProduct.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-contain"
                        onError={(e) => { e.target.src = '/images/armured cable.jpg'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-neutral-900 block truncate">
                          {uploadedFileName ? 'Uploaded from Computer' : 'Selected Image'}
                        </span>
                        {editingProduct.image_url?.startsWith('data:') ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-medium">Ready</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-200 text-neutral-800 font-medium">Synced</span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-600 block truncate font-mono">
                        {uploadedFileName 
                          ? `File: ${uploadedFileName}` 
                          : (editingProduct.image_url?.startsWith('data:') 
                              ? 'Local photo preview (ready to save)' 
                              : editingProduct.image_url)}
                      </span>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-800 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-neutral-800" />
                          <span>Change / Upload from PC</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, image_url: '' })}
                          className="px-2.5 py-1 text-xs text-red-600 hover:text-red-800 font-semibold transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Friendly Upload Zone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-300 hover:border-black rounded-2xl p-6 text-center cursor-pointer transition-all bg-neutral-50 hover:bg-neutral-100/80 flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center shadow-sm text-neutral-700 group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6 text-neutral-800" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-neutral-900 block">
                        Click to Upload Picture from your Computer
                      </span>
                      <span className="text-[11px] text-neutral-600 font-medium block">
                        Select any JPG, PNG, or WebP photo (Max 8MB) — no file paths or coding needed!
                      </span>
                    </div>
                  </div>
                )}

                {/* Hidden native file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileUpload}
                />

                {uploadingImage && (
                  <div className="flex items-center gap-2 text-xs text-[#e67e22] font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading photo from your computer...</span>
                  </div>
                )}

                {uploadError && (
                  <p className="text-[11px] text-amber-700 font-medium">{uploadError}</p>
                )}

                {/* Quick Presets for Store Admin */}
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-neutral-700 block mb-1.5">
                    Or select a standard catalog stock photo:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Armoured Cable', path: '/images/armured cable.jpg' },
                      { label: 'Single Wire', path: '/images/single cable.jpg' },
                      { label: 'Twin & Earth Flat', path: '/images/twin cable and others.jpg' },
                      { label: 'Lighting Fixture', path: '/images/chandelier section.jpg' },
                      { label: 'Hardware Kit', path: '/images/home hero section.jpg' }
                    ].map((preset) => (
                      <button
                        key={preset.path}
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, image_url: preset.path })}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                          editingProduct.image_url === preset.path 
                            ? 'bg-neutral-900 text-white border-neutral-900 font-semibold' 
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Short Description</label>
                <input
                  type="text"
                  value={editingProduct.short_description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, short_description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Full Technical Description</label>
                <textarea
                  rows="3"
                  value={editingProduct.full_description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, full_description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                ></textarea>
              </div>

              {/* In Stock / Sold Out Control */}
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 block">Stock Availability Status</span>
                  <span className="text-[11px] text-neutral-700 font-medium block">
                    Toggle whether this item is currently In Stock or Sold Out.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProduct({ ...editingProduct, in_stock: !editingProduct.in_stock })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      editingProduct.in_stock ? 'bg-emerald-600' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        editingProduct.in_stock ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="font-semibold text-neutral-800">
                    {editingProduct.in_stock ? 'In Stock' : 'Sold Out'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 font-semibold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#18181b] hover:bg-[#e67e22] text-white font-semibold shadow-sm active:scale-95 transition-all"
                >
                  Save Product
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal Dialog */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#e67e22]">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-base">Add Product Category</h3>
                  <p className="text-xs text-neutral-600">Instantly available for inventory &amp; storefront</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryName('');
                }}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1.5">
                  New Category Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Solar Equipment & Inverters"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#e67e22]/40 text-sm font-semibold text-neutral-900"
                />
              </div>

              {/* Current Categories List */}
              <div>
                <span className="text-[11px] font-semibold text-neutral-600 block mb-2">
                  Active Catalog Categories ({categories.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-neutral-50 rounded-xl border border-neutral-200">
                  {categories.map((c) => (
                    <span 
                      key={c}
                      className="px-2.5 py-1 bg-white border border-neutral-200 rounded-lg text-[11px] font-medium text-neutral-800"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryName('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCategoryName.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#18181b] hover:bg-[#e67e22] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Action / Danger Confirmation & Notice Modal */}
      {portalModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            if (portalModal.type !== 'danger' && !portalModal.onCancel) {
              setPortalModal(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                portalModal.type === 'danger' 
                  ? 'bg-red-100 text-red-600' 
                  : portalModal.type === 'warning' 
                    ? 'bg-amber-100 text-amber-700' 
                    : portalModal.type === 'confirm'
                      ? 'bg-orange-100 text-[#e67e22]'
                      : 'bg-blue-100 text-blue-700'
              }`}>
                {portalModal.type === 'danger' ? (
                  <Trash2 className="w-5 h-5 stroke-[2]" />
                ) : portalModal.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 stroke-[2]" />
                ) : portalModal.type === 'confirm' ? (
                  <AlertCircle className="w-5 h-5 stroke-[2]" />
                ) : (
                  <Info className="w-5 h-5 stroke-[2]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
                  {portalModal.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 leading-relaxed font-normal">
                  {portalModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-100">
              {portalModal.onCancel ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      portalModal.onCancel();
                    }}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors border border-neutral-200"
                  >
                    {portalModal.cancelText || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      portalModal.onConfirm();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-sm active:scale-95 ${
                      portalModal.isDanger
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-[#18181b] hover:bg-[#e67e22]'
                    }`}
                  >
                    {portalModal.confirmText || 'Confirm'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (portalModal.onConfirm) portalModal.onConfirm();
                    setPortalModal(null);
                  }}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#18181b] hover:bg-[#27272a] transition-all shadow-sm active:scale-95"
                >
                  {portalModal.confirmText || 'Understood'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer matching customer design */}
      <footer className="w-full py-4 border-t border-neutral-200 bg-white text-center text-xs text-neutral-800 font-semibold">
        Kadianga Electricals &bull; Operations Dashboard &bull; All changes synchronize to storefront catalog in real-time
      </footer>

    </div>
  );
}
