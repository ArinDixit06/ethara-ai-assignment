# Inventory Management System — Frontend

A modern, premium, and fully responsive **Inventory Management System** frontend built with **React 18**, **TypeScript**, and **Vite**, styled using **Tailwind CSS v3** and Radix UI primitives. It features a complete set of features to handle products, stock levels, orders, supplier accounts, and analytics.

---

## Tech Stack

- **Core**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v3
- **Component Primitives**: Radix UI (shadcn/ui layout standards)
- **State Management**: Zustand
- **Server Cache / Data Fetching**: TanStack React Query v5
- **Routing**: React Router v6
- **Forms & Validation**: React Hook Form + Zod resolvers
- **Charts**: Recharts (with Indigo/Rose themed colors)
- **Icons**: Lucide React
- **HTTP Client**: Axios with jwt attach interceptors
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns
- **Table**: TanStack Table v8

---

## Folder Structure

```
src/
├── api/               # Axios client + REST API service files
│   ├── axiosInstance.ts
│   ├── auth.api.ts
│   ├── products.api.ts
│   ├── inventory.api.ts
│   ├── orders.api.ts
│   ├── suppliers.api.ts
│   └── reports.api.ts
├── components/
│   ├── ui/            # Radix UI primitives
│   ├── layout/        # Sidebar, Topbar, Layout grid, PageHeader
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── Layout.tsx
│   │   └── PageHeader.tsx
│   ├── common/        # DataTable, ConfirmDialog, StatusBadge, EmptyState, LoadingSpinner, SearchInput
│   │   ├── DataTable.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── SearchInput.tsx
│   └── forms/         # ProductForm, OrderForm (reusable PO/SO)
│       ├── ProductForm.tsx
│       └── OrderForm.tsx
├── hooks/             # Custom debounces, stores, and permissions
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── usePermissions.ts
├── pages/             # Layout screen pages
│   ├── auth/          # LoginPage, RegisterPage
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── dashboard/     # DashboardPage
│   │   └── DashboardPage.tsx
│   ├── products/      # Products catalog and details
│   │   ├── ProductsPage.tsx
│   │   └── ProductDetailPage.tsx
│   ├── inventory/     # Inventory stock levels and movements
│   │   ├── InventoryPage.tsx
│   │   └── StockMovementsPage.tsx
│   ├── orders/        # Purchase and Sales orders listings
│   │   ├── PurchaseOrdersPage.tsx
│   │   ├── SalesOrdersPage.tsx
│   │   └── OrderDetailPage.tsx
│   ├── suppliers/     # Suppliers listings and drawers
│   │   └── SuppliersPage.tsx
│   └── reports/       # Valuation, movements, PO summaries
│       └── ReportsPage.tsx
├── store/             # Zustand stores
│   ├── authStore.ts
│   └── uiStore.ts
├── types/             # TypeScript type declarations
│   ├── auth.types.ts
│   ├── product.types.ts
│   ├── inventory.types.ts
│   ├── order.types.ts
│   └── supplier.types.ts
├── utils/             # Formatters and shared validation schemas
│   ├── formatters.ts
│   └── validators.ts
├── router/            # Routes configuration and Guards
│   └── index.tsx
├── App.tsx            # Context and Query Client Setup
└── main.tsx           # React entry point
```

---

## Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10 or higher

---

## Quick Start Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
   Modify `.env` variables if required (default is set to local backend API):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Available Scripts

- `npm run dev`: Starts the local hot-reloaded development environment.
- `npm run build`: Compiles the TypeScript configurations and compiles production bundles.
- `npm run preview`: Previews the compiled production bundle locally.
- `npm run lint`: Runs ESLint syntax verification.

---

## Docker Setup Instructions

To build and run the frontend inside a Docker container:

1. **Build the image**:
   ```bash
   docker build -t inventory-frontend .
   ```

2. **Run the container**:
   ```bash
   docker run -p 3000:80 --name inventory-frontend-instance inventory-frontend
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Screenshots Placeholder

*(Dashboard metrics graphs, responsive order placement forms, and stock warnings tables will go here)*
