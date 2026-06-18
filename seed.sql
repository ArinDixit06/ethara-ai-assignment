-- Clear any existing data in tables to ensure idempotent re-runs
TRUNCATE TABLE "OrderStatusHistory" CASCADE;
TRUNCATE TABLE "OrderLineItem" CASCADE;
TRUNCATE TABLE "Order" CASCADE;
TRUNCATE TABLE "StockMovement" CASCADE;
TRUNCATE TABLE "ProductSupplier" CASCADE;
TRUNCATE TABLE "Product" CASCADE;
TRUNCATE TABLE "Supplier" CASCADE;
TRUNCATE TABLE "Category" CASCADE;
TRUNCATE TABLE "User" CASCADE;

-- 1. Insert Default Users (all default passwords are: Password123!)
INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive", "createdAt", "updatedAt") VALUES
('usr_admin_01', 'Admin User', 'admin@example.com', '$2a$12$0nYZ/ZmjcpAgJC5bDnF/dOvKhnMI7pwBS8g4sfeKVYXGW7znaSNSC', 'ADMIN', true, NOW(), NOW()),
('usr_manager_01', 'Manager User', 'manager@example.com', '$2a$12$0nYZ/ZmjcpAgJC5bDnF/dOvKhnMI7pwBS8g4sfeKVYXGW7znaSNSC', 'MANAGER', true, NOW(), NOW()),
('usr_staff_01', 'Staff User', 'staff@example.com', '$2a$12$0nYZ/ZmjcpAgJC5bDnF/dOvKhnMI7pwBS8g4sfeKVYXGW7znaSNSC', 'STAFF', true, NOW(), NOW());

-- 2. Insert Categories
INSERT INTO "Category" ("id", "name", "createdAt") VALUES
('cat_elec_01', 'Electronics', NOW()),
('cat_app_01', 'Apparel', NOW()),
('cat_home_01', 'Home Appliances', NOW()),
('cat_food_01', 'Food & Beverages', NOW());

-- 3. Insert Suppliers
INSERT INTO "Supplier" ("id", "name", "contactPerson", "email", "phone", "address", "paymentTerms", "notes", "isActive", "createdAt", "updatedAt") VALUES
('sup_apex_01', 'Apex Distributors', 'Alex Gupta', 'alex@apexdist.in', '+91 98765 43210', '102 Industrial Area, Sector 5, Noida, UP', 'Net 30', 'Primary supplier for electrical and peripheral goods', true, NOW(), NOW()),
('sup_glob_01', 'Globex Corp Wholesale', 'Sara Connor', 'sara@globexwholesale.co.in', '+91 99999 88888', 'G-42, MIDC Industrial Zone, Andheri East, Mumbai', 'Net 15', 'Handles clothing bulk shipments', true, NOW(), NOW()),
('sup_prime_01', 'Prime Wholesale India', 'David Miller', 'david.miller@primewholesale.in', '+91 88888 77777', 'Plot 18, Phase II, Okhla Industrial Area, New Delhi', 'COD', 'Instant payments required on receipt', true, NOW(), NOW());

-- 4. Insert Products
INSERT INTO "Product" ("id", "name", "sku", "categoryId", "description", "unitPrice", "costPrice", "unitOfMeasure", "reorderThreshold", "currentStock", "imageUrl", "isActive", "createdAt", "updatedAt") VALUES
('prod_key_01', 'Wireless Ergonomic Keyboard', 'ELE-KEY-A9F1', 'cat_elec_01', 'Ergonomic 2.4GHz wireless keyboard with multi-device connections', 2499.00, 1500.00, 'pcs', 15, 45, NULL, true, NOW(), NOW()),
('prod_head_01', 'Noise Cancelling Headset', 'ELE-HD-B8G2', 'cat_elec_01', 'Over-ear active noise cancelling bluetooth headphones', 8999.00, 5500.00, 'pcs', 10, 5, NULL, true, NOW(), NOW()),
('prod_coffee_01', 'Organic Arabica Coffee Beans (1kg)', 'FOB-COF-C7H3', 'cat_food_01', 'Single-origin medium roast organic coffee beans', 1200.00, 800.00, 'bags', 5, 0, NULL, true, NOW(), NOW()),
('prod_chair_01', 'Mesh Office Chair', 'HOM-CHR-D6I4', 'cat_home_01', 'High-back ergonomic office chair with adjustable armrests', 12500.00, 8500.00, 'pcs', 8, 25, NULL, true, NOW(), NOW()),
('prod_shirt_01', 'Cotton Slim Fit T-Shirt (M)', 'APP-TSH-E5J5', 'cat_app_01', '100% premium cotton slim-fit active sports t-shirt', 999.00, 500.00, 'pcs', 20, 120, NULL, true, NOW(), NOW());

-- 5. Link Products to Suppliers (ProductSupplier)
INSERT INTO "ProductSupplier" ("productId", "supplierId") VALUES
('prod_key_01', 'sup_apex_01'),
('prod_head_01', 'sup_apex_01'),
('prod_coffee_01', 'sup_prime_01'),
('prod_chair_01', 'sup_glob_01'),
('prod_shirt_01', 'sup_glob_01');

-- 6. Insert Stock Movements
INSERT INTO "StockMovement" ("id", "productId", "type", "quantity", "previousStock", "newStock", "reason", "referenceId", "notes", "createdById", "createdAt") VALUES
('mov_key_01', 'prod_key_01', 'INBOUND', 45, 0, 45, 'Initial catalog intake', NULL, 'Transferred from Delhi central warehouse', 'usr_admin_01', NOW() - INTERVAL '3 days'),
('mov_head_01', 'prod_head_01', 'INBOUND', 20, 0, 20, 'Initial catalog intake', NULL, 'Transferred from Delhi central warehouse', 'usr_admin_01', NOW() - INTERVAL '3 days'),
('mov_head_02', 'prod_head_01', 'OUTBOUND', 15, 20, 5, 'Sold / Sales fulfillment', 'ord_so_02', 'Fulfillment of corporate order SO-2026-0002', 'usr_staff_01', NOW() - INTERVAL '1 day'),
('mov_coffee_01', 'prod_coffee_01', 'INBOUND', 15, 0, 15, 'Purchase order received', 'ord_po_01', 'PO-2026-0001 shipment checked in', 'usr_manager_01', NOW() - INTERVAL '2 days'),
('mov_coffee_02', 'prod_coffee_01', 'OUTBOUND', 15, 15, 0, 'Sold / Sales fulfillment', 'ord_so_01', 'SO-2026-0001 client dispatch', 'usr_staff_01', NOW() - INTERVAL '1 day'),
('mov_chair_01', 'prod_chair_01', 'INBOUND', 23, 0, 23, 'Initial catalog intake', NULL, 'Unpackaged inventory stock intake', 'usr_admin_01', NOW() - INTERVAL '3 days'),
('mov_chair_02', 'prod_chair_01', 'ADJUSTMENT', 2, 23, 25, 'Audit Correction', NULL, 'Corrected count error during monthly audits', 'usr_admin_01', NOW() - INTERVAL '12 hours'),
('mov_shirt_01', 'prod_shirt_01', 'INBOUND', 120, 0, 120, 'Initial catalog intake', NULL, 'Cotton stock batch intake', 'usr_admin_01', NOW() - INTERVAL '3 days');

-- 7. Insert Orders
INSERT INTO "Order" ("id", "orderNumber", "type", "status", "supplierId", "customerName", "customerContact", "notes", "totalAmount", "expectedDate", "createdById", "createdAt", "updatedAt") VALUES
('ord_po_01', 'PO-2026-0001', 'PURCHASE', 'RECEIVED', 'sup_prime_01', NULL, NULL, 'Urgent stock intake for organic coffee bags', 12000.00, NOW() - INTERVAL '2 days', 'usr_manager_01', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
('ord_po_02', 'PO-2026-0002', 'PURCHASE', 'DRAFT', 'sup_apex_01', NULL, NULL, 'Drafting purchase orders for upcoming electronic accessories sales', 75000.00, NOW() + INTERVAL '5 days', 'usr_admin_01', NOW() - INTERVAL '1 day', NOW()),
('ord_so_01', 'SO-2026-0001', 'SALES', 'FULFILLED', NULL, 'Jane Doe Cafe Corp', 'jane.doe@cafecorp.in', 'Direct delivery to South Extension cafe branch', 18000.00, NOW() - INTERVAL '1 day', 'usr_staff_01', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('ord_so_02', 'SO-2026-0002', 'SALES', 'FULFILLED', NULL, 'Alpha Infotech Services', 'purchase@alphatech.co.in', 'Bulk tech setup noise cancelling headset dispatch', 134985.00, NOW() - INTERVAL '1 day', 'usr_staff_01', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');

-- 8. Insert Order Line Items
INSERT INTO "OrderLineItem" ("id", "orderId", "productId", "quantity", "unitPrice", "subtotal") VALUES
('line_po_01_a', 'ord_po_01', 'prod_coffee_01', 15, 800.00, 12000.00),
('line_po_02_a', 'ord_po_02', 'prod_key_01', 50, 1500.00, 75000.00),
('line_so_01_a', 'ord_so_01', 'prod_coffee_01', 15, 1200.00, 18000.00),
('line_so_02_a', 'ord_so_02', 'prod_head_01', 15, 8999.00, 134985.00);

-- 9. Insert Order Status Histories
INSERT INTO "OrderStatusHistory" ("id", "orderId", "status", "notes", "createdAt") VALUES
('his_po_01_1', 'ord_po_01', 'DRAFT', 'Created draft purchase outline', NOW() - INTERVAL '3 days'),
('his_po_01_2', 'ord_po_01', 'CONFIRMED', 'Confirmed pricing with Prime Wholesale', NOW() - INTERVAL '2 days' - INTERVAL '12 hours'),
('his_po_01_3', 'ord_po_01', 'RECEIVED', 'Shipment arrived at dock. Quality checks passed. Current stock updated.', NOW() - INTERVAL '2 days'),
('his_po_02_1', 'ord_po_02', 'DRAFT', 'Drafting accessories replenishments', NOW() - INTERVAL '1 day'),
('his_so_01_1', 'ord_so_01', 'DRAFT', 'Sales inquiry from Cafe Corp', NOW() - INTERVAL '2 days'),
('his_so_01_2', 'ord_so_01', 'CONFIRMED', 'Payment authorization clear', NOW() - INTERVAL '1 day' - INTERVAL '18 hours'),
('his_so_01_3', 'ord_so_01', 'FULFILLED', 'Dispatched from central facility. Items received.', NOW() - INTERVAL '1 day'),
('his_so_02_1', 'ord_so_02', 'DRAFT', 'Alpha Infotech sales draft', NOW() - INTERVAL '2 days'),
('his_so_02_2', 'ord_so_02', 'CONFIRMED', 'Order confirmed by administrator', NOW() - INTERVAL '1 day' - INTERVAL '18 hours'),
('his_so_02_3', 'ord_so_02', 'FULFILLED', 'Dispatched and delivered', NOW() - INTERVAL '1 day');
