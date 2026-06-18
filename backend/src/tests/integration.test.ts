import request from 'supertest';
import { app } from '../app';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import { Role, OrderStatus, OrderType, MovementType } from '@prisma/client';

let managerToken: string;
let staffToken: string;
let testProduct: any;
let testCategory: any;
let testSupplier: any;
let testPurchaseOrder: any;
let testSalesOrder: any;

beforeAll(async () => {
  // Purge test database tables before starting
  await prisma.orderLineItem.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.productSupplier.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // Seed default test users
  const adminUser = await prisma.user.create({
    data: { name: 'Admin Test', email: 'admin-test@example.com', passwordHash, role: Role.ADMIN },
  });
  await prisma.user.create({
    data: { name: 'Manager Test', email: 'manager-test@example.com', passwordHash, role: Role.MANAGER },
  });
  await prisma.user.create({
    data: { name: 'Staff Test', email: 'staff-test@example.com', passwordHash, role: Role.STAFF },
  });

  // Login and fetch JWTs
  await request(app).post('/api/auth/login').send({
    email: 'admin-test@example.com',
    password: 'Password123!',
  });

  const resManager = await request(app).post('/api/auth/login').send({
    email: 'manager-test@example.com',
    password: 'Password123!',
  });
  managerToken = resManager.body.data.token;

  const resStaff = await request(app).post('/api/auth/login').send({
    email: 'staff-test@example.com',
    password: 'Password123!',
  });
  staffToken = resStaff.body.data.token;

  // Seed category, supplier, and initial product
  testCategory = await prisma.category.create({ data: { name: 'Test Category' } });
  testSupplier = await prisma.supplier.create({
    data: { name: 'Test Supplier', email: 'supplier@test.com', phone: '1234567890' },
  });

  testProduct = await prisma.product.create({
    data: {
      name: 'Test Product Widget',
      sku: 'TEST-SKU-1000',
      categoryId: testCategory.id,
      unitPrice: 500.0,
      costPrice: 300.0,
      currentStock: 20,
      reorderThreshold: 10,
    },
  });

  // Purchase Order for receive tests
  testPurchaseOrder = await prisma.order.create({
    data: {
      orderNumber: 'PO-TST-0001',
      type: OrderType.PURCHASE,
      status: OrderStatus.SHIPPED,
      supplierId: testSupplier.id,
      totalAmount: 1500.0,
      createdById: adminUser.id,
      lineItems: {
        create: [
          { productId: testProduct.id, quantity: 5, unitPrice: 300.0, subtotal: 1500.0 },
        ],
      },
    },
  });

  // Sales Order for fulfillment tests
  testSalesOrder = await prisma.order.create({
    data: {
      orderNumber: 'SO-TST-0001',
      type: OrderType.SALES,
      status: OrderStatus.SHIPPED,
      totalAmount: 1000.0,
      createdById: adminUser.id,
      lineItems: {
        create: [
          { productId: testProduct.id, quantity: 2, unitPrice: 500.0, subtotal: 1000.0 },
        ],
      },
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Integration Tests — Inventory Management System API', () => {
  // 1. POST /api/auth/login
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin-test@example.com', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('admin-test@example.com');
    });

    it('should return 401 Unauthorized for invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin-test@example.com', password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid');
    });

    it('should return 422 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin-test@example.com' }); // missing password

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('password');
    });
  });

  // 2. GET /api/products
  describe('GET /api/products', () => {
    it('should block unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(401);
    });

    it('should return a paginated product list with 200 for authenticated requests', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta.page).toBe(1);
    });
  });

  // 3. POST /api/products
  describe('POST /api/products', () => {
    it('should block creation for STAFF role (403)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Staff Product Attempt',
          unitPrice: 100,
          costPrice: 50,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow creation for MANAGER role (201)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Manager Product Widget',
          sku: 'MGR-SKU-999',
          categoryId: testCategory.id,
          unitPrice: 800.0,
          costPrice: 500.0,
          currentStock: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Manager Product Widget');
    });

    it('should block creation with 409 duplicate SKU', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Duplicate SKU Product',
          sku: 'TEST-SKU-1000', // Matches testProduct seeded in beforeAll
          unitPrice: 400.0,
          costPrice: 200.0,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  // 4. POST /api/inventory/adjust
  describe('POST /api/inventory/adjust', () => {
    it('should perform a valid stock adjustment and update quantities (200)', async () => {
      const res = await request(app)
        .post('/api/inventory/adjust')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          productId: testProduct.id,
          type: 'REMOVE',
          quantity: 5,
          reason: 'Defective widgets cleanup',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.currentStock).toBe(15); // 20 - 5 = 15
    });

    it('should reject adjustment with 400 if removing quantity exceeds stock', async () => {
      const res = await request(app)
        .post('/api/inventory/adjust')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          productId: testProduct.id,
          type: 'REMOVE',
          quantity: 100, // stock is 15
          reason: 'Too many items subtraction',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // 5. POST /api/orders/:id/receive
  describe('POST /api/orders/:id/receive', () => {
    it('should process purchase order receipt, increment stock, and record INBOUND movement', async () => {
      // Current stock of testProduct is 15. The purchase order has 5 widgets.
      const res = await request(app)
        .post(`/api/orders/${testPurchaseOrder.id}/receive`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(OrderStatus.RECEIVED);

      // Verify stock level incremented from 15 to 20
      const prod = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(prod?.currentStock).toBe(20);

      // Verify stock movement recorded
      const movement = await prisma.stockMovement.findFirst({
        where: {
          productId: testProduct.id,
          type: MovementType.INBOUND,
          referenceId: testPurchaseOrder.id,
        },
      });
      expect(movement).toBeDefined();
      expect(movement?.quantity).toBe(5);
    });
  });

  // 6. POST /api/orders/:id/fulfill
  describe('POST /api/orders/:id/fulfill', () => {
    it('should process sales order fulfillment, decrement stock, and record OUTBOUND movement', async () => {
      // Current stock is 20. The sales order has 2 widgets.
      const res = await request(app)
        .post(`/api/orders/${testSalesOrder.id}/fulfill`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(OrderStatus.FULFILLED);

      // Verify stock decremented from 20 to 18
      const prod = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(prod?.currentStock).toBe(18);

      // Verify stock movement recorded
      const movement = await prisma.stockMovement.findFirst({
        where: {
          productId: testProduct.id,
          type: MovementType.OUTBOUND,
          referenceId: testSalesOrder.id,
        },
      });
      expect(movement).toBeDefined();
      expect(movement?.quantity).toBe(2);
    });

    it('should block fulfillment with 400 if stock is insufficient', async () => {
      // Seed a sales order of 50 units (current stock is 18)
      const orderShortage = await prisma.order.create({
        data: {
          orderNumber: 'SO-TST-SHORTAGE',
          type: OrderType.SALES,
          status: OrderStatus.SHIPPED,
          totalAmount: 25000.0,
          createdById: testSalesOrder.createdById,
          lineItems: {
            create: [
              { productId: testProduct.id, quantity: 50, unitPrice: 500.0, subtotal: 25000.0 },
            ],
          },
        },
      });

      const res = await request(app)
        .post(`/api/orders/${orderShortage.id}/fulfill`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Insufficient stock');
    });
  });
});
