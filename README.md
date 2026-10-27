# ⚡ Aura Store — Modern Simple E-Commerce Store

A full-stack, responsive e-commerce web application featuring product listings, live search & filtering, dynamic product details pages, an interactive slide-out shopping cart, multi-step checkout with order validation, and real-time order tracking.

---

## 🌟 Features Overview

- **Dynamic Product Catalog**: 12+ realistic products across Electronics, Fashion, Home & Kitchen, and Accessories with high-res imagery, rating stars, price calculations, and discount badges.
- **User Authentication & Simple Login Page (`login.html`)**:
  - Clean, distraction-free card layout with tab toggle for **Sign In** and **Create Account**.
  - One-click **⚡ Quick Demo Login** button for instant testing.
  - Interactive password visibility toggle (show/hide), "Remember Me" option.
  - User profile badge in header across all pages with sign out capability.
  - Auto-populates customer shipping information during checkout when logged in.
- **Instant Search & Category Filters**: Real-time debounced keyword search, category pills with count badges, and multi-criteria sorting (Price, Rating, Newest).
- **Interactive Product Details (`product.html` & Quick View Modal)**:
  - Multi-image gallery with thumbnail switcher.
  - Live stock availability badges (In Stock, Low Stock, Out of Stock).
  - Specifications table & verified customer reviews.
  - Quantity picker with maximum stock enforcement.
  - "Add to Cart" and immediate "Buy Now" flow.
- **Persistent Shopping Cart (`cart.js`)**:
  - Saved in browser `localStorage` across reloads and pages.
  - Slide-out drawer accessible from any page.
  - Free Shipping threshold progress bar ($50 limit).
  - Promo code system (`SAVE10` for 10% off, `DISCOUNT20` for 20% off, `FREESHIP` for free delivery).
- **Multi-Step Checkout & Order Processing (`checkout.html`)**:
  - Customer contact & shipping address with form validation.
  - Standard vs. Express shipping calculation.
  - Card payment simulation with auto-formatting and Cash on Delivery (COD) options.
  - Server-side inventory verification and price recalculation.
- **Order Confirmation & Printable Receipt**:
  - Post-checkout confirmation screen with generated unique Order ID (`ORD-2026-XXXX`).
  - Printable / saveable PDF-ready invoice receipt (`window.print()`).
  - Direct link to live Order Tracker.
- **Live Order Tracking (`track-order.html`)**:
  - Lookup any order by ID (e.g., `ORD-2026-1001`).
  - Multi-stage visual timeline: *Placed ➔ Processing ➔ In Transit ➔ Delivered*.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | HTML5 (Semantic), Modern CSS3 (Variables, Flexbox, Grid, Keyframe Animations), Vanilla JavaScript (ES6+, Fetch API, LocalStorage) |
| **Backend** | Node.js, Express.js REST API, CORS middleware |
| **Persistence** | Atomic JSON file database engine (`products.json`, `orders.json`) with zero external DB configuration required |

---

## 📂 Project Directory Structure

```text
simple-ecommerce-store/
├── backend/
│   ├── data/
│   │   ├── db.js             # Data access layer & atomic operations
│   │   ├── products.json     # 12+ catalog products seed data
│   │   └── orders.json       # Orders persistence & tracking storage
│   ├── routes/
│   │   ├── products.js       # Products, categories & search endpoints
│   │   └── orders.js         # Cart validation, checkout & tracking routes
│   ├── server.js             # Express.js main server & static host
│   ├── test-api.js           # Network integration test suite
│   └── test-in-memory.js     # In-memory validation test suite
├── frontend/
│   ├── css/
│   │   └── styles.css        # Complete modern design system
│   ├── js/
│   │   ├── api.js            # Centralized API client service
│   │   ├── app.js            # Catalog controller, search, filter & quick view
│   │   ├── cart.js           # Shopping cart manager & slide-out drawer
│   │   ├── checkout.js       # Checkout workflow & payment validation
│   │   ├── product.js        # Dedicated product details page controller
│   │   └── track.js          # Order status tracking controller
│   ├── index.html            # Storefront homepage & product catalog
│   ├── product.html          # Standalone product details view
│   ├── checkout.html         # Checkout & invoice confirmation view
│   └── track-order.html      # Order tracking lookup view
├── package.json              # Project scripts & Express/CORS dependencies
└── README.md                 # Complete documentation & user guide
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v16 or higher) installed on your system.

### 2. Installation
Open your terminal inside the project directory (`simple-ecommerce-store`):

```bash
npm install
```

### 3. Start the Server
Start the Express server:

```bash
npm start
```

Or run with automatic reload during development:

```bash
npm run dev
```

The server will boot and display:
```text
===============================================
🛒 Simple E-Commerce Store Backend is LIVE!
🌐 Server running at: http://localhost:5000
📦 API Endpoints:     http://localhost:5000/api/products
🛍️ Storefront URL:    http://localhost:5000
===============================================
```

### 4. Open in Your Browser
Visit **[http://localhost:5000](http://localhost:5000)** in any web browser to view and interact with the store.

---

## 📡 REST API Reference

### Products
- `GET /api/products` — Returns all products.
  - Query parameters:
    - `category`: Filter by category (e.g. `Electronics`, `Fashion`, `Home & Kitchen`, `Accessories`).
    - `search`: Keyword search matching title, description, or category.
    - `sort`: `newest`, `price-asc`, `price-desc`, `rating`, `name-asc`.
- `GET /api/products/:id` — Returns single product details with full specs.
- `GET /api/products/:id/related` — Returns 3-4 related products in the same category.
- `GET /api/products/categories` — Returns list of categories with product count.

### Orders & Checkout
- `POST /api/orders/validate-cart` — Validates item IDs, quantities, and current stock.
- `POST /api/orders` — Submits customer order, deducts stock, and creates tracking record.
- `GET /api/orders/:id` — Fetches order status, tracking timeline, and invoice data by Order ID.

---

## 👤 Demo Login Credentials

For quick testing, use the pre-configured account or click the **⚡ Quick Login** button on the login page:
- **Email**: `demo@aurastore.com`
- **Password**: `password123`

---

## 🎟️ Available Promo Codes for Testing

| Code | Effect |
| :--- | :--- |
| `SAVE10` | 10% discount on order subtotal |
| `DISCOUNT20` | 20% discount on order subtotal |
| `FREESHIP` | 100% Free standard shipping waiver |

---

## 🔍 Sample Order ID for Tracking Test
Try tracking the pre-seeded order on the tracking page:
- **Order ID**: `ORD-2026-1001`
- Or complete any checkout to generate a new live Order ID (e.g., `ORD-2026-XXXX`).

---

## 🧪 Automated Testing
Run the comprehensive in-memory test suite:

```bash
node backend/test-in-memory.js
```
All 12 validation tests run and verify database operations, stock management, pricing calculations, discount deductions, and order placement.
