# ⚡ VoltCraft Electrical & Lighting — User Manual & Operations Guide

Welcome to the **VoltCraft Electrical Quotation Platform**. This document provides an exhaustive, step-by-step user manual for customers, electrical contractors, and the shop owner/administrators, along with technical explanations of the offline-first architecture, concurrency safeguards, and notification lifecycle.

---

## 📑 Table of Contents
1. [Core Design Philosophy & Zero-Friction Model](#1-core-design-philosophy--zero-friction-model)
2. [Customer Journey (Zero Login)](#2-customer-journey-zero-login)
   - [Exploring Products & Specifications](#exploring-products--specifications)
   - [Managing the Quotation Cart](#managing-the-quotation-cart)
   - [Requesting Quotes via the System](#requesting-quotes-via-the-system)
   - [Sharing Quotes via WhatsApp](#sharing-quotes-via-whatsapp)
   - [Email Confirmation Receipt](#email-confirmation-receipt)
3. [Shop Owner & Administrator Portal](#3-shop-owner--administrator-portal)
   - [Accessing the Console](#accessing-the-console)
   - [Quotation Pricing Calculator](#quotation-pricing-calculator)
   - [1-Click Quotation Email Dispatch](#1-click-quotation-email-dispatch)
   - [1-Click Direct WhatsApp Reply](#1-click-direct-whatsapp-reply)
   - [Full Inventory CRUD Operations](#full-inventory-crud-operations)
4. [Offline-First Architecture & Network Resilience](#4-offline-first-architecture--network-resilience)
   - [Local IndexedDB & CacheStorage](#local-indexeddb--cachestorage)
   - [Automatic Synchronization Queue](#automatic-synchronization-queue)
   - [Idempotent Submission Guarantee](#idempotent-submission-guarantee)
5. [Dual-Screen & Foldable Phone Usability](#5-dual-screen--foldable-phone-usability)
6. [Notification & Email Templates](#6-notification--email-templates)

---

## 1. Core Design Philosophy & Zero-Friction Model

Unlike standard e-commerce shops that force users to register accounts, remember passwords, and provide credit card details before interacting:
- **No Login Required for Customers:** Because commercial electrical pricing fluctuates with daily copper commodity prices and contractor volume tiers, clients can freely add products, configure custom drum lengths, and request a quotation with only their contact information.
- **Dual Communication Pathways:** Clients can choose between official automated email quotations or instant WhatsApp chats depending on their workflow on the job site.
- **Offline Reliability:** Electricians and site engineers working in basement builds or remote sites with spotty network coverage can still browse cached inventory and prepare quotes offline.

---

## 2. Customer Journey (Zero Login)

### Exploring Products & Specifications
1. **Home Hero Section:** Visualizes modern architectural lighting and ambient interior hardware with quick stats (`4.8 ★ | 250k Clients | Save up to 20% on bulk`).
2. **Chandeliers Section:** Editorial showcase featuring spun brass pendant clusters and modern ceiling fixtures.
3. **Power Cables Section:** Interactive 3-way segment switcher for:
   - **Armoured Underground Cables (4-Core XLPE SWA)**
   - **Single Core Conduit Building Wires (100m sealed rolls)**
   - **Twin & Earth Flat Power Cable & Switchgear Kits**
4. **Product Catalog Grid:** Category tabs (*Armoured Cables, Single Core Cables, Twin & Earth Cables, Chandeliers, Switchgear & Meters, Accessories*), search bar with live filtering, and pagination controls (`1, 2, 3, 4 ->`).
5. **Amazon / Alibaba Style Product View:** Clicking any card opens a rich modal with:
   - Full specification sheet (Voltage rating, Conductor material, Sheath type, Standards compliance).
   - Quantity stepper and custom specification note field (e.g., *"Cut 75m from drum"*).
   - "Add to Quotation Cart" and "Inquire This Item Directly on WhatsApp" buttons.

### Managing the Quotation Cart
1. Click the **"Quotation Cart"** pill button in the top navigation bar.
2. The cart modal displays:
   - Selected product thumbnail, SKU, and user notes.
   - Quantity stepper (`- [Qty] +`) to adjust requirements.
   - Estimated line total and subtotal.
   - Trash icon to remove items.

### Requesting Quotes via the System
1. Enter your **Full Name**, **Phone Number**, **Email Address**, and optional **Site Location** and **Project Notes**.
2. Click **"Request Quotation via System"**:
   - The quotation request is securely transmitted to the database.
   - If connected, an automated receipt confirmation email is immediately dispatched to your inbox.
   - If offline, the quote is queued in local IndexedDB storage and submitted automatically the moment internet connectivity returns.
3. The **"Thank You ->"** screen appears showing your unique **Quotation Reference ID** (e.g., `EQ-2026-4626`).

### Sharing Quotes via WhatsApp
- Clicking **"Share Quote via WhatsApp Directly"** encodes the entire quotation request (including customer details, requested quantities, and items) and opens WhatsApp pre-populated with a message addressed to the shop owner's dispatch line.
- You can review and tap Send directly inside WhatsApp.

---

## 3. Shop Owner & Administrator Portal

### Accessing the Console
1. Click the **"Shop Owner"** badge in the top-right corner of the website.
2. The system authenticates using the secure Bearer token (`ADMIN_TOKEN`).
3. You are presented with real-time operational statistics:
   - Total Quotations Received
   - Pending Review Count
   - Quoted / Active Pipeline
   - Quoted Dollar Value Pipeline

### Quotation Pricing Calculator
1. Under **"Quotation Requests"**, click on any received quote to open the **Pricing Drawer**.
2. View customer project notes, delivery site, and requested items.
3. For each line item, input the exact **Quoted Unit Price ($)** based on current copper stock.
4. Set optional **Discounts ($)** or **Delivery Fees ($)**.
5. Add custom **Shop Owner Terms** (e.g., *"Quotation valid for 14 days. Free offloading at site."*).
6. Click **"1. Save Pricing to DB"** to record the calculation in the database.

### 1-Click Quotation Email Dispatch
- Click **"2. Send Quote via Email"**.
- The Go backend's asynchronous worker renders a branded, mobile-responsive HTML quote document and delivers it directly to the customer's inbox.
- Status is automatically updated to `quoted` with timestamp tracking.

### 1-Click Direct WhatsApp Reply
- Click **"3. Reply on WhatsApp"**.
- Opens WhatsApp with a preformatted, professional quote breakdown including line items, unit prices, discounts, grand total, and validity terms ready to send to the customer with one tap.

### Full Inventory CRUD Operations
1. Switch to the **"Products Inventory"** tab.
2. **Add Product:** Click **"+ Add New Product"** to input SKU, name, category, image URL, base guide price, and technical specs JSON.
3. **Edit Product:** Click the pencil icon on any product card to update details.
4. **Delete Product:** Click the trash icon to remove decommissioned products.
5. Invalidation hook automatically flushes product cache to reflect updates instantaneously.

---

## 4. Offline-First Architecture & Network Resilience

1. **Client Storage Layer (IndexedDB & LocalStorage):**
   - Catalog products are cached locally upon initial load.
   - The shopping cart is preserved across sessions and tab reloads.
2. **Pending Queue:**
   - Quotation submissions attempted while offline are assigned a unique `client_uuid` and stored in IndexedDB under `pending_quotes`.
   - The UI displays an amber *"Offline Mode - Auto-Sync Armed"* badge.
3. **Automatic Synchronization:**
   - The browser registers `online` event listeners. When network is restored, the sync engine dispatches a batch request to `POST /api/quotes/sync`.
   - The Go backend verifies `client_uuid` to ensure idempotent processing with zero duplicate entries.
4. **Backend Concurrency & Reliability:**
   - SQLite database runs in **Write-Ahead Logging (WAL)** mode with 5000ms busy timeout, allowing concurrent readers and writers without lock contention.
   - B-tree indexing on `category`, `slug`, `status`, `customer_email`, and `created_at`.
   - Sliding-window in-memory rate limiting prevents API abuse and quote spam.
   - Thread-safe memory cache with TTL expiration handles catalog reads with microsecond latency.

---

## 5. Dual-Screen & Foldable Phone Usability

The application includes tailored styles for modern foldable smartphones and dual-screen devices (e.g., Samsung Galaxy Z Fold 5/6, Galaxy Z Flip, Microsoft Surface Duo):
- **Unfolded / Dual-Pane:** Utilizes CSS media queries `(screen-spanning: single-fold-vertical)` and `(min-width: 540px) and (max-width: 720px)` to split views cleanly across the hinge:
  - Hero section adapts with photography on one side and specifications on the other.
  - Cart layout splits into selected line items on the left display and quotation form on the right display.
- **Folded / Cover Screen:** Automatically falls back to a compact, thumb-friendly single-column layout with minimum tap target sizes of 44px.
