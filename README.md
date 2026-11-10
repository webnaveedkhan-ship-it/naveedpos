# 🛒 NaveedPOS - Modern Point of Sale System

> **NaveedPOS** is a high-performance, production-ready full-stack MERN (MongoDB, Express, React, Node.js) Point of Sale system built for fast counter checkouts, real-time inventory management, thermal receipt printing, and sales analytics.

---

## ⚡ Tech Stack

- **Backend:** Node.js, Express.js, MongoDB with Mongoose ODM
- **Frontend:** React (Vite), React Router DOM, Axios, Lucide React
- **Styling:** Tailwind CSS (Modern dark/light neutral accents with fast POS ergonomics)
- **Security:** JWT (JSON Web Tokens) with `bcryptjs` password hashing & Role-Based Access Control
- **File Uploads:** Multer ready for product imagery

---

## 🚀 Key Features

### 1. Role-Based Authentication & Staff Control
- **Roles:**
  - **Admin**: Full access to analytics dashboard, product catalog CRUD, cost price & profit margin metrics, and staff management.
  - **Cashier**: Fast POS checkout terminal, live cart, thermal receipt printing, and orders history.
- Pre-seeded accounts ready out of the box with one-click demo login buttons.

### 2. Fast POS Checkout Terminal
- **Live Search & Barcode Scan:** Search by product title or scan SKU/Barcode. Pressing `Enter` with a matched SKU immediately adds the item to the order.
- **Category Filter Pills:** Quickly filter items by 'Beverages', 'Snacks & Bakery', 'Dairy', 'Electronics', etc.
- **Live Cart Calculations:** Instant calculations for subtotal, configurable tax (VAT/GST %), and percentage or fixed dollar discounts.
- **Strict Stock Guard:** Prevents adding more items than available in inventory, warning the cashier in real-time.
- **Flexible Payments:**
  - **Cash:** Live change calculator with quick-tender buttons ($10, $20, $50, $100, Exact).
  - **Card:** Terminal integration simulation with card last 4 digits logging.
  - **Split Payment:** Seamlessly split total balance between cash and card payments.

### 3. Atomic Order Processing & 80mm Thermal Receipts
- **Atomic Stock Decrement:** When an order is completed, product stock is decremented atomically in MongoDB with automatic rollback safety.
- **Printable Thermal Receipts:** Styled with clean CSS `@media print` formatted for standard 80mm POS thermal receipt printers (`window.print()`).
- **Receipt History:** Filter past orders by date range, payment method, cashier, or order ID, with one-click receipt reprint.

### 4. Inventory & Stock Watch
- Comprehensive item management with `title`, `sku`, `category`, `price`, `costPrice`, `stockQuantity`, `lowStockAlert`, and image.
- Visual badges for **In Stock**, **Low Stock** (pulsing threshold warning), and **Out of Stock**.
- Profit margin calculation preview on product creation/editing.

### 5. Sales Analytics & Performance Dashboard
- **Key Metrics:** Today's Gross Revenue, Today's Order Count, Low Stock items needing replenishment, and Total Active Catalog Items.
- **Last 7 Days Sales Trend:** Responsive daily gross revenue bar chart.
- **Top 5 Selling Products Leaderboard:** Real-time ranking by units sold and revenue.

---

## 📂 Project Architecture

```
NaveedPOS/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection & resilient fallback
│   │   ├── controllers/
│   │   │   ├── authController.js     # JWT login, register, profile
│   │   │   ├── productController.js  # Product CRUD, category & SKU search
│   │   │   ├── orderController.js    # Atomic checkout & stock deduction
│   │   │   ├── analyticsController.js# Sales aggregations & dashboard metrics
│   │   │   └── userController.js     # Staff management (Admin only)
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # Token verification & role guard
│   │   │   ├── errorMiddleware.js    # Standardized API error responses
│   │   │   └── uploadMiddleware.js   # Multer file upload handler
│   │   ├── models/
│   │   │   ├── User.js               # User schema & password hashing
│   │   │   ├── Product.js            # Product & low stock virtuals
│   │   │   ├── Category.js           # Category schema
│   │   │   └── Order.js              # Order items & payment breakdown
│   │   ├── routes/                   # Express REST API routes
│   │   ├── seeder/
│   │   │   └── seedData.js           # Rich retail catalog demo seeder
│   │   ├── uploads/                  # Product imagery upload storage
│   │   └── server.js                 # Express app initialization
│   ├── .env.example
│   ├── .env
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/               # Navbar, Collapsible Sidebar, Modal, StatCard
│   │   │   ├── pos/                  # ProductGrid, CartPane, PaymentModal, ReceiptModal
│   │   │   └── inventory/            # ProductModal, StockBadge
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Auth state & token storage
│   │   │   └── CartContext.jsx       # Cart calculations & stock guard
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx         # Modern login with one-click demo fill
│   │   │   ├── PosPage.jsx           # High-speed checkout terminal
│   │   │   ├── InventoryPage.jsx     # Stock tracking & product CRUD
│   │   │   ├── OrdersPage.jsx        # Transaction logs & receipt reprint
│   │   │   ├── DashboardPage.jsx     # Sales charts & analytics
│   │   │   └── StaffPage.jsx         # Staff & cashier account administration
│   │   ├── services/
│   │   │   └── api.js                # Axios client with JWT interceptor
│   │   ├── App.jsx                   # Routes & role-based route protection
│   │   ├── main.jsx                  # React DOM entry
│   │   └── index.css                 # Tailwind base & 80mm print stylesheet
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   └── package.json
└── package.json                      # Monorepo convenience scripts
```

---

## 🔑 Default Credentials (After Seeding)

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@naveedpos.com` | `admin123` | Full access (Dashboard, Products, Staff, POS) |
| **Cashier** | `cashier@naveedpos.com` | `cashier123` | POS Terminal, Orders & Receipts |

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (Local MongoDB service or MongoDB Atlas connection string)

### 2. Installation

In the root directory, install dependencies for both server and client:

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 3. Environment Setup

Ensure `server/.env` contains your settings:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/naveedpos
JWT_SECRET=naveedpos_super_secret_jwt_key_2026_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
DEFAULT_TAX_RATE=8
```

### 4. Database Seeding

Populate the database with sample users, retail categories, products (including low-stock examples), and past orders:

```bash
cd server
npm run seed
```

### 5. Running the Application

Run the backend and frontend concurrently:

```bash
# Terminal 1: Backend Server (runs on http://localhost:5000)
cd server
npm run dev

# Terminal 2: Frontend Client (runs on http://localhost:5173)
cd client
npm run dev
```

Open `http://localhost:5173` in your browser. Use the one-click demo credentials on the login page to access the terminal!
