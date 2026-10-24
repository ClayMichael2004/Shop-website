# ⚡ VoltCraft Electrical & Lighting — Quotation Web Platform

> A full-stack, offline-first electrical supply website and direct quotation management system. Built with **React** (Tailwind CSS, Lucide icons, IndexedDB) and a high-concurrency **Go** backend (SQLite WAL mode, in-memory caching, rate limiting, and transactional email/WhatsApp dispatch).

---

## 📸 Inspiration & Visual Design System Mapping

All UI components and layouts are styled based on the provided reference blueprints:
- **Home Hero Section** (`home hero section.jpg`): Warm, dark ambient lighting, *"Build your dream home / Discover and create your perfect living space with us"*, pill CTA *"Get Started >"*, and frosted-glass floating stats bar (`4.8 ★ | Stylish interiors | 250k Customers served | Save 20%`).
- **Chandelier Section** (`chandelier section.jpg`): Editorial layout with serif typography *"unique modern collection"*, delicate divider lines, *"Explore"*, and suspended brass chandeliers.
- **Cables Section** (`armured cable.jpg`, `single cable.jpg`, `twin cable and others.jpg`): 3-way interactive segment switcher showcasing Armoured Underground Cables, Single Core Building Conduit Coils, and Twin & Earth Flat Cables.
- **Product Catalog Grid** (`items section layout.jpg`): Clean e-commerce grid, category pills, search bar, stock status, and numbered pagination (`1, 2, 3, 4 ->`).
- **Amazon / Alibaba Style Product Detail Modal**: High-res gallery preview, structured technical specifications table, quantity stepper, "Add to Quote Cart", and "Instant WhatsApp Quote".
- **Cart to Request Quotation** (`cart to request quotation.jpg`): Rounded cart container with itemized table, quantity steppers, estimated totals, 90-day guarantee badge, and dual submission buttons (*"Request Quotation via System"* and *"Share Quote via WhatsApp"*).
- **Contact Us Section** (`contact us 2.jpg`): Warm beige background with watermark typography, inquiry pills (*"Retail Enquiries"* / *"Wholesale & Contractor Desk"*), clean underline input fields, and pill Send button.
- **Footer Section** (`footer design.jpg`): Minimalist layout with explore links, channel pills, direct call button, and massive geometric watermark brand typography (*"voltcraft"*).
- **Loading Screen** (`loading screen.jpg`): Centered progress spinner ring, animated percentage progress, *"Loading... Please wait a moment"*, and security footer badge.
- **Error Pages** (`error message inspo.jpg`): Clean red accent graphics (404 ghost and maintenance cone) with clear recovery buttons.
- **Icons** (`icons inspo.jpg`): Clean 1.5px/2px stroke minimalist icons throughout.
- **Background UI Pattern** (`background ui design pattern.jpg`): Subtle perspective 3D hexagonal mesh grid pattern background.

---

## 🛠️ Project Structure

```
Shop-website/
├── assets/                       # Inspiration & product image assets
├── backend/                      # High-concurrency Go API server
│   ├── cmd/server/main.go        # HTTP server entrypoint & router
│   ├── internal/
│   │   ├── cache/cache.go        # Thread-safe in-memory cache with TTL
│   │   ├── config/config.go      # Environment & configuration loader
│   │   ├── database/database.go  # SQLite WAL mode & auto migrations/seeds
│   │   ├── handlers/handlers.go  # REST API handlers
│   │   ├── middleware/           # CORS, IP rate limiter & admin auth
│   │   ├── models/models.go      # Domain models & sync payloads
│   │   └── service/              # Product, Quote, Email & WhatsApp services
│   ├── Dockerfile                # Multi-stage production container
│   ├── go.mod & go.sum
│   └── test_shop.db              # Auto-generated SQLite database
├── frontend/                     # React + Vite + Tailwind CSS frontend
│   ├── public/images/            # Static product & inspo images
│   ├── src/
│   │   ├── components/           # Navbar, Heroes, Catalog, Modals, Admin
│   │   ├── offline/db.js         # IndexedDB offline-first sync engine
│   │   ├── App.jsx               # Application root
│   │   ├── index.css             # Tailwind & Duo phone responsive styles
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── vercel.json               # 1-click Vercel deployment configuration
├── USER_MANUAL.md                # Comprehensive user & operations manual
└── README.md
```

---

## 🚀 Local Setup & Run Guide

### Prerequisites
- **Node.js** (v18+ or v24+ recommended)
- **Go** (v1.22+ or v1.27+ recommended)
- **Git**

### 1. Run the Backend API Server
```powershell
# Navigate into backend directory
cd backend

# Build and start the server
go run ./cmd/server
```
The Go server will start on `http://localhost:8080`.
- SQLite database is automatically created at `./data/electrical_shop.db` with WAL mode and initial seed catalog.
- Health check available at `http://localhost:8080/api/health`.

### 2. Run the Frontend Development Server
In a new terminal window:
```powershell
# Navigate into frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.
All `/api/*` requests are automatically proxied to `http://localhost:8080`.

---

## 🧪 Running Automated Tests

Run backend unit tests for database migrations, caching, quote generation, and offline idempotency:
```powershell
cd backend
go test ./... -v
```

---

## 🌐 Deployment Guide

### Option 1: Deploying Backend to Render
1. Create a free account on [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository containing this project.
4. Set **Root Directory** to `backend`.
5. Select **Docker** as the Runtime (or select Go and set Build Command `go build -o server ./cmd/server` and Start Command `./server`).
6. Add Environment Variables (optional):
   - `PORT`: `8080`
   - `SHOP_NAME`: `VoltCraft Electrical & Lighting`
   - `SHOP_WHATSAPP`: `254712345678`
   - `ADMIN_TOKEN`: `voltcraft-admin-secure-2026`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (if using production SMTP; otherwise mock logging is used automatically).
7. Click **Create Web Service**. Note your Render URL (e.g., `https://voltcraft-api.onrender.com`).

### Option 2: Deploying Frontend to Vercel
1. Create an account on [Vercel.com](https://vercel.com).
2. Click **Add New** -> **Project** and select your repository.
3. Set **Root Directory** to `frontend`.
4. The build settings will automatically detect Vite:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Update `frontend/vercel.json` with your Render backend URL:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://voltcraft-api.onrender.com/api/$1"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
6. Click **Deploy**. Your electrical shop is live worldwide!

---

## 📱 Responsive & Dual-Screen / Duo Phone Design

The application incorporates container queries and foldable screen CSS:
```css
@media (screen-spanning: single-fold-vertical) {
  .duo-fold-split {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
  }
}
```
When opened on a dual-screen device (Microsoft Surface Duo, Samsung Galaxy Z Fold 5/6, Galaxy Z Flip):
- Unfolded: Photography and item details render side-by-side cleanly across the hinge.
- Cart Drawer: Item table displays on the primary screen, and quotation summary / WhatsApp buttons display on the secondary screen.
- Folded: Clean single-column layout with touch-friendly tap targets.

---

## 🛡️ License
Private commercial software built for VoltCraft Electrical & Lighting.
