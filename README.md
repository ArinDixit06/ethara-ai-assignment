# Inventory Management System Backend

This is a production-ready, highly secure, and containerized REST API backend for an **Inventory Management System (IMS)**. It is built using Node.js, TypeScript, Express, PostgreSQL, and Prisma ORM. It provides robust authentication, role-based access control (RBAC), file uploading for product images, automatic stock movements on orders, analytical reports, database transactions, automated SKU generation, and Swagger API documentation.

---

## Features

- **Authentication & Security**:
  - Secure JWT authentication with short-lived tokens and token blacklisting on logout.
  - Password hashing via `bcryptjs` (12 salt rounds).
  - Web security protection using `helmet` headers, strict `cors` policies, and rate-limiting on authentication routes.
  - Full request logging with Morgan and Winston.
- **Role-Based Access Control (RBAC)**:
  - Three distinct user roles: `ADMIN`, `MANAGER`, and `STAFF`.
  - Secure routes locked down based on user roles (e.g. only ADMINs can manage users, STAFF can only read, etc.).
- **Product & Category Management**:
  - Full CRUD operations on products and categories.
  - Automated unique SKU generation (e.g., `ELE-MOBI-A4F2`) using product category and metadata.
  - Multer-supported file uploads for product images with automatic type validation (JPEG, PNG, WEBP) and size limits.
  - Product lists filtering by low stock thresholds, categorizations, and activity levels.
- **Inventory Tracking**:
  - Automatic logging of `INBOUND` and `OUTBOUND` stock movements on order fulfillments.
  - Support for manual stock adjustments (`ADD`, `REMOVE`, `SET`) with database transactions to preserve integrity.
  - Low stock flags and active total inventory valuations.
- **Order Processing (Purchase & Sales)**:
  - Purchase Orders (PO) for inbound inventory.
  - Sales Orders (SO) for outbound inventory.
  - Automated state machine checking: DRAFT $\rightarrow$ CONFIRMED $\rightarrow$ SHIPPED $\rightarrow$ RECEIVED/FULFILLED $\rightarrow$ CANCELLED.
  - Dynamic stock check validations during sales order fulfillments to prevent inventory deficits.
- **Data Export & Reports**:
  - Export product records and inventory log movements to Excel-friendly CSV sheets.
  - Comprehensive analytical reports: dashboard stats, daily stock movement histories (7-day chart logs), categories value breakdowns, and vendor expenses.
- **API Documentation**:
  - Full OpenAPI documentation rendered nicely using Swagger UI at `/api/docs`.
- **Testing**:
  - Complete integration test suite using Jest and Supertest.
- **Containerization**:
  - Dockerized services for Node backend and Postgres DB using Docker Compose.

---

## Tech Stack

- **Runtime Environment**: Node.js 20+ & TypeScript
- **Web Framework**: Express.js v4
- **Database Engine**: PostgreSQL 15
- **ORM (Object Relational Mapping)**: Prisma ORM
- **Security & Validator**: JSONWebToken, Bcrypt.js, Helmet, Express-Rate-Limit, Zod
- **File Uploads**: Multer
- **Logger**: Winston Logger + Morgan
- **Testing Engine**: Jest & Supertest
- **Containers**: Docker & Docker Compose

---

## Project Structure

```text
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database models and schemas
│   │   └── seed.ts            # Seeding script with realistic Indian demo data
│   ├── src/
│   │   ├── config/            # Prisma connection, Zod env validation, Swagger specs
│   │   ├── middleware/        # JWT auth, RBAC permissions, validators, multer uploads, error logging
│   │   ├── modules/           # Auth, Users, Categories, Products, Suppliers, Inventory, Orders, Reports
│   │   ├── types/             # Custom TypeScript Express Request overrides
│   │   ├── utils/             # ApiResponse wrappers, custom error, pagination, SKU utilities, logger
│   │   ├── app.ts             # Express App middleware configuration
│   │   └── server.ts          # Server listener initialization
│   ├── Dockerfile             # Multi-stage production container build
│   └── tsconfig.json          # TypeScript compilation settings
├── frontend/
│   └── Dockerfile             # Stub frontend Nginx server configurations
└── docker-compose.yml         # Compose configuration file for backend, frontend, and db
```

---

## Prerequisites

Ensure you have the following installed locally:
1. **Node.js** (v20 or higher)
2. **npm** (v10 or higher)
3. **Docker Desktop** (for containerized runs)
4. **PostgreSQL** (v15 or higher - optional if running locally outside Docker)

---

## Local Development Setup

To run and edit the application locally without Docker:

### 1. Install Dependencies
Navigate to the `backend/` directory and install the Node packages:
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to a new file named `.env`:
```bash
cp .env.example .env
```
Ensure your local PostgreSQL instance is running, and adjust `DATABASE_URL` in `.env` if necessary.

### 3. Apply Database Migrations
Generate the Prisma client and apply database migrations to setup tables:
```bash
npx prisma migrate dev --name init
```

### 4. Seed Database
Load the initial demo records:
```bash
npm run prisma:seed
```

### 5. Run the Application
Start the server in hot-reloading development mode:
```bash
npm run dev
```
The server will start listening at **`http://localhost:5000`**. You can access the Swagger API docs at **`http://localhost:5000/api/docs`**.

---

## Running Tests

To execute the Jest + Supertest integration tests suite:
1. Make sure you have a test database running and configure `DATABASE_URL` in `.env.test`.
2. Run migrations on the test database:
   ```bash
   dotenv -e .env.test -- npx prisma migrate dev
   ```
3. Run the test script:
   ```bash
   npm run test
   ```

---

## Docker Container Setup

To run the entire system (Database, Backend, and Frontend Stub) containerized:

From the project root directory (where `docker-compose.yml` is located):

```bash
docker-compose up --build
```

- **Backend API**: `http://localhost:5000/api/`
- **Swagger Documentation**: `http://localhost:5000/api/docs`
- **Frontend Stub**: `http://localhost:3000`

To tear down the containers and preserve database volumes:
```bash
docker-compose down
```
To clear the volumes and restart with fresh data:
```bash
docker-compose down -v
```

---

## Environment Variables Configuration

The following env vars are validated by Zod inside `backend/src/config/env.ts`:

| Name | Description | Default |
|------|-------------|---------|
| `PORT` | Listening port for the Express HTTP server | `5000` |
| `NODE_ENV` | Environment execution mode (`development`, `production`, `test`) | `development` |
| `DATABASE_URL` | PostgreSQL connection URL string | `postgresql://postgres:password@localhost:5432/inventory_db` |
| `JWT_SECRET` | Secret key used to sign JWT session payloads (min 32 chars) | `your_very_secure_jwt_secret_min_32_chars` |
| `JWT_EXPIRES_IN` | Duration before session tokens expire | `7d` |
| `UPLOAD_DIR` | Storage path for product image uploads | `./uploads` |
| `MAX_FILE_SIZE_MB` | Maximum allowed image upload size in Megabytes | `5` |
| `LOG_LEVEL` | Logging verbosity for Winston (`error`, `warn`, `info`, `http`, `debug`) | `info` |

---

## Default Seed User Credentials

The database seed script generates the following default users (all share password: `Password123!`):

| Email | Full Name | Role | Access Level |
|-------|-----------|------|--------------|
| `admin@example.com` | Admin User | `ADMIN` | Read-write access to all resources; User management, soft-deletes |
| `manager@example.com` | Manager User | `MANAGER` | Read-write access to stock, orders, categories, and products |
| `staff@example.com` | Staff User | `STAFF` | Read-only access to products/categories; Profile change password |

---

## Available npm Scripts (under `backend/`)

- `npm run dev`: Boots server in hot-reloading development mode using `ts-node-dev`.
- `npm run build`: Compiles TypeScript source files into clean JavaScript code under `./dist/`.
- `npm start`: Runs the compiled production code from `./dist/server.js`.
- `npm run prisma:generate`: Re-generates the Prisma Client.
- `npm run prisma:migrate`: Runs migrations on the development database.
- `npm run prisma:seed`: Seeds the database with high-fidelity mock records.
- `npm run db:setup`: Single command to generate Prisma client, migrate DB, and seed data.
- `npm run test`: Executes the integration tests using the isolated test database environment.
- `npm run test:coverage`: Executes tests and builds code coverage reports.
