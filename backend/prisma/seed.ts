import { PrismaClient, Role, OrderType, OrderStatus, MovementType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing data (order is important to respect FK constraints)
  console.log('🧹 Cleaning existing tables...');
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderLineItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.productSupplier.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default password
  console.log('🔑 Generating password hashes...');
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // 3. Create Users
  console.log('👥 Creating default users...');
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      name: 'Manager User',
      email: 'manager@example.com',
      passwordHash,
      role: Role.MANAGER,
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      name: 'Staff User',
      email: 'staff@example.com',
      passwordHash,
      role: Role.STAFF,
    },
  });

  const users = [adminUser, managerUser, staffUser];

  // 4. Create Categories
  console.log('📂 Creating categories...');
  const categories = {
    electronics: await prisma.category.create({ data: { name: 'Electronics' } }),
    clothing: await prisma.category.create({ data: { name: 'Clothing' } }),
    food: await prisma.category.create({ data: { name: 'Food & Beverages' } }),
    office: await prisma.category.create({ data: { name: 'Office Supplies' } }),
    tools: await prisma.category.create({ data: { name: 'Tools' } }),
  };

  // 5. Create Suppliers
  console.log('🏢 Creating suppliers...');
  const suppliers = {
    tata: await prisma.supplier.create({
      data: {
        name: 'Tata Motors Ltd',
        contactPerson: 'Ratan Tata',
        email: 'info@tatamotors.com',
        phone: '+912266658282',
        address: 'Bombay House, 24 Homi Mody Street, Mumbai, Maharashtra 400001',
        paymentTerms: 'Net 30',
        notes: 'Primary engineering parts partner',
      },
    }),
    reliance: await prisma.supplier.create({
      data: {
        name: 'Reliance Retail Ltd',
        contactPerson: 'Mukesh Ambani',
        email: 'support@relianceretail.com',
        phone: '+912235555000',
        address: 'Maker Chambers IV, Nariman Point, Mumbai, Maharashtra 400021',
        paymentTerms: 'Net 45',
        notes: 'Retail inventory and clothing goods supplier',
      },
    }),
    itc: await prisma.supplier.create({
      data: {
        name: 'ITC Limited',
        contactPerson: 'Sanjiv Puri',
        email: 'contact@itc.in',
        phone: '+913322889371',
        address: 'Virginia House, 37 J.L. Nehru Road, Kolkata, West Bengal 700071',
        paymentTerms: 'Net 15',
        notes: 'Primary food and beverages supply chain partner',
      },
    }),
    infosys: await prisma.supplier.create({
      data: {
        name: 'Infosys Technologies',
        contactPerson: 'Salil Parekh',
        email: 'procurement@infosys.com',
        phone: '+918028520261',
        address: 'Electronics City, Hosur Road, Bengaluru, Karnataka 560100',
        paymentTerms: 'Net 30',
        notes: 'Hardware systems developer and technical supplier',
      },
    }),
  };

  // 6. Create Products
  console.log('📦 Creating products...');
  const productsData = [
    // Electronics
    { name: 'Developer Laptop X1', sku: 'ELE-LAP-0001', categoryId: categories.electronics.id, unitPrice: 75000.0, costPrice: 60000.0, currentStock: 15, reorderThreshold: 10 },
    { name: 'Android SmartPhone V10', sku: 'ELE-SMT-0002', categoryId: categories.electronics.id, unitPrice: 22000.0, costPrice: 17000.0, currentStock: 25, reorderThreshold: 15 },
    { name: 'Curved LED Monitor 27"', sku: 'ELE-MON-0003', categoryId: categories.electronics.id, unitPrice: 15000.0, costPrice: 11000.0, currentStock: 5, reorderThreshold: 8 }, // LOW STOCK
    { name: 'Mechanical Keyboard RGB', sku: 'ELE-KEY-0004', categoryId: categories.electronics.id, unitPrice: 3500.0, costPrice: 2200.0, currentStock: 3, reorderThreshold: 10 },   // LOW STOCK
    { name: 'Wireless Ergonomic Mouse', sku: 'ELE-MOU-0005', categoryId: categories.electronics.id, unitPrice: 1800.0, costPrice: 900.0, currentStock: 40, reorderThreshold: 20 },

    // Clothing
    { name: 'Classic Crewneck T-Shirt', sku: 'CLO-TSH-0006', categoryId: categories.clothing.id, unitPrice: 999.0, costPrice: 450.0, currentStock: 100, reorderThreshold: 30 },
    { name: 'Slim Fit Denim Jeans', sku: 'CLO-JNS-0007', categoryId: categories.clothing.id, unitPrice: 2499.0, costPrice: 1200.0, currentStock: 8, reorderThreshold: 15 },    // LOW STOCK
    { name: 'Genuine Leather Jacket', sku: 'CLO-JKT-0008', categoryId: categories.clothing.id, unitPrice: 5999.0, costPrice: 3500.0, currentStock: 4, reorderThreshold: 5 },    // LOW STOCK
    { name: 'Breathable Sports Shoes', sku: 'CLO-SHO-0009', categoryId: categories.clothing.id, unitPrice: 3999.0, costPrice: 2000.0, currentStock: 50, reorderThreshold: 15 },

    // Food & Beverages
    { name: 'Assam Organic Green Tea', sku: 'FNB-TEA-0010', categoryId: categories.food.id, unitPrice: 350.0, costPrice: 200.0, currentStock: 120, reorderThreshold: 20 },
    { name: 'Instant Premium Coffee Jar', sku: 'FNB-COF-0011', categoryId: categories.food.id, unitPrice: 480.0, costPrice: 300.0, currentStock: 6, reorderThreshold: 10 },     // LOW STOCK
    { name: '70% Dark Chocolate Bar', sku: 'FNB-CHO-0012', categoryId: categories.food.id, unitPrice: 180.0, costPrice: 90.0, currentStock: 80, reorderThreshold: 25 },
    { name: 'Roasted Salted Almonds 250g', sku: 'FNB-ALM-0013', categoryId: categories.food.id, unitPrice: 550.0, costPrice: 350.0, currentStock: 45, reorderThreshold: 15 },

    // Office Supplies
    { name: 'Executive Leather Notebook', sku: 'OFF-NOT-0014', categoryId: categories.office.id, unitPrice: 450.0, costPrice: 200.0, currentStock: 200, reorderThreshold: 50 },
    { name: 'Retractable Gel Pens Pack', sku: 'OFF-PEN-0015', categoryId: categories.office.id, unitPrice: 150.0, costPrice: 75.0, currentStock: 150, reorderThreshold: 40 },
    { name: 'Heavy Duty Stapler', sku: 'OFF-STP-0016', categoryId: categories.office.id, unitPrice: 350.0, costPrice: 180.0, currentStock: 12, reorderThreshold: 10 },
    { name: 'A4 Printer Paper Ream', sku: 'OFF-PPR-0017', categoryId: categories.office.id, unitPrice: 299.0, costPrice: 180.0, currentStock: 2, reorderThreshold: 15 },      // LOW STOCK

    // Tools
    { name: 'Precision Screwdriver Set', sku: 'TLS-SCR-0018', categoryId: categories.tools.id, unitPrice: 850.0, costPrice: 450.0, currentStock: 35, reorderThreshold: 10 },
    { name: 'Claw Hammer 16oz', sku: 'TLS-HAM-0019', categoryId: categories.tools.id, unitPrice: 499.0, costPrice: 220.0, currentStock: 2, reorderThreshold: 5 },          // LOW STOCK
    { name: 'Adjustable Wrench 10"', sku: 'TLS-WRN-0020', categoryId: categories.tools.id, unitPrice: 650.0, costPrice: 320.0, currentStock: 18, reorderThreshold: 8 },
    { name: 'Power Rotary Drill 650W', sku: 'TLS-DRL-0021', categoryId: categories.tools.id, unitPrice: 3800.0, costPrice: 2200.0, currentStock: 6, reorderThreshold: 5 },
  ];

  const products = [];
  for (const item of productsData) {
    const prod = await prisma.product.create({
      data: {
        name: item.name,
        sku: item.sku,
        categoryId: item.categoryId,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
        currentStock: item.currentStock,
        reorderThreshold: item.reorderThreshold,
        isActive: true,
      },
    });
    products.push(prod);
  }

  // 7. Associate Products with Suppliers
  console.log('🔗 Connecting products and suppliers...');
  // Associate electronics with Tata/Infosys
  const electronicsList = products.filter((p) => p.categoryId === categories.electronics.id);
  for (const p of electronicsList) {
    await prisma.productSupplier.create({ data: { productId: p.id, supplierId: suppliers.tata.id } });
    await prisma.productSupplier.create({ data: { productId: p.id, supplierId: suppliers.infosys.id } });
  }
  // Associate clothing with Reliance
  const clothingList = products.filter((p) => p.categoryId === categories.clothing.id);
  for (const p of clothingList) {
    await prisma.productSupplier.create({ data: { productId: p.id, supplierId: suppliers.reliance.id } });
  }
  // Associate food with ITC
  const foodList = products.filter((p) => p.categoryId === categories.food.id);
  for (const p of foodList) {
    await prisma.productSupplier.create({ data: { productId: p.id, supplierId: suppliers.itc.id } });
  }
  // Associate tools & office with Tata/Infosys
  const otherList = products.filter((p) => p.categoryId === categories.tools.id || p.categoryId === categories.office.id);
  for (const p of otherList) {
    await prisma.productSupplier.create({ data: { productId: p.id, supplierId: suppliers.infosys.id } });
  }

  // 8. Create Purchase Orders
  console.log('📝 Creating purchase orders...');
  const poDates = [
    new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    new Date(),
  ];

  // PO 1: RECEIVED (Completed)
  const po1 = await prisma.order.create({
    data: {
      orderNumber: 'PO-2026-0001',
      type: OrderType.PURCHASE,
      status: OrderStatus.RECEIVED,
      supplierId: suppliers.tata.id,
      notes: 'Monthly electronics restock completed',
      expectedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      totalAmount: 180000.0,
      createdById: managerUser.id,
      createdAt: poDates[0],
      lineItems: {
        create: [
          { productId: products[0].id, quantity: 3, unitPrice: 60000.0, subtotal: 180000.0 }, // Developer Laptop X1
        ],
      },
      statusHistory: {
        createMany: {
          data: [
            { status: OrderStatus.DRAFT, notes: 'Order draft created', createdAt: poDates[0] },
            { status: OrderStatus.CONFIRMED, notes: 'Confirmed and sent to Tata Motors', createdAt: new Date(poDates[0].getTime() + 1 * 60 * 60 * 1000) },
            { status: OrderStatus.SHIPPED, notes: 'Shipped from Tata warehouse', createdAt: new Date(poDates[0].getTime() + 24 * 60 * 60 * 1000) },
            { status: OrderStatus.RECEIVED, notes: 'Items received and counted', createdAt: new Date(poDates[0].getTime() + 48 * 60 * 60 * 1000) },
          ],
        },
      },
    },
  });

  // PO 2: SHIPPED (Transit)
  const po2 = await prisma.order.create({
    data: {
      orderNumber: 'PO-2026-0002',
      type: OrderType.PURCHASE,
      status: OrderStatus.SHIPPED,
      supplierId: suppliers.reliance.id,
      notes: 'Clothing stock replenishment',
      expectedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      totalAmount: 13500.0,
      createdById: managerUser.id,
      createdAt: poDates[1],
      lineItems: {
        create: [
          { productId: products[5].id, quantity: 10, unitPrice: 450.0, subtotal: 4500.0 }, // Classic T-Shirt
          { productId: products[6].id, quantity: 5, unitPrice: 1200.0, subtotal: 6000.0 },  // Denim Jeans
          { productId: products[8].id, quantity: 1, unitPrice: 3000.0, subtotal: 3000.0 },  // Sports Shoes
        ],
      },
      statusHistory: {
        createMany: {
          data: [
            { status: OrderStatus.DRAFT, notes: 'Order draft created', createdAt: poDates[1] },
            { status: OrderStatus.CONFIRMED, notes: 'Order approved by finance', createdAt: new Date(poDates[1].getTime() + 2 * 60 * 60 * 1000) },
            { status: OrderStatus.SHIPPED, notes: 'Consignment handed to courier', createdAt: new Date(poDates[1].getTime() + 36 * 60 * 60 * 1000) },
          ],
        },
      },
    },
  });

  // PO 3: CONFIRMED
  const po3 = await prisma.order.create({
    data: {
      orderNumber: 'PO-2026-0003',
      type: OrderType.PURCHASE,
      status: OrderStatus.CONFIRMED,
      supplierId: suppliers.itc.id,
      notes: 'Food category safety stock update',
      expectedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      totalAmount: 9000.0,
      createdById: adminUser.id,
      createdAt: poDates[2],
      lineItems: {
        create: [
          { productId: products[9].id, quantity: 30, unitPrice: 200.0, subtotal: 6000.0 }, // Green Tea
          { productId: products[11].id, quantity: 10, unitPrice: 300.0, subtotal: 3000.0 }, // Coffee
        ],
      },
      statusHistory: {
        createMany: {
          data: [
            { status: OrderStatus.DRAFT, notes: 'Order draft created', createdAt: poDates[2] },
            { status: OrderStatus.CONFIRMED, notes: 'Approved and confirmed by ITC rep', createdAt: new Date(poDates[2].getTime() + 4 * 60 * 60 * 1000) },
          ],
        },
      },
    },
  });

  // PO 4: DRAFT
  const po4 = await prisma.order.create({
    data: {
      orderNumber: 'PO-2026-0004',
      type: OrderType.PURCHASE,
      status: OrderStatus.DRAFT,
      supplierId: suppliers.infosys.id,
      notes: 'Tools and equipment restock draft',
      expectedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      totalAmount: 11000.0,
      createdById: managerUser.id,
      createdAt: poDates[3],
      lineItems: {
        create: [
          { productId: products[20].id, quantity: 5, unitPrice: 2200.0, subtotal: 11000.0 }, // Power Drill
        ],
      },
      statusHistory: {
        create: {
          status: OrderStatus.DRAFT,
          notes: 'Draft setup initiated',
          createdAt: poDates[3],
        },
      },
    },
  });

  // PO 5: CANCELLED
  const po5 = await prisma.order.create({
    data: {
      orderNumber: 'PO-2026-0005',
      type: OrderType.PURCHASE,
      status: OrderStatus.CANCELLED,
      supplierId: suppliers.tata.id,
      notes: 'Duplicate order - cancelled',
      totalAmount: 22000.0,
      createdById: adminUser.id,
      createdAt: poDates[4],
      lineItems: {
        create: [
          { productId: products[2].id, quantity: 2, unitPrice: 11000.0, subtotal: 22000.0 }, // Monitor
        ],
      },
      statusHistory: {
        createMany: {
          data: [
            { status: OrderStatus.DRAFT, notes: 'Draft setup', createdAt: poDates[4] },
            { status: OrderStatus.CANCELLED, notes: 'Cancelled due to double entry', createdAt: new Date(poDates[4].getTime() + 15 * 60 * 1000) },
          ],
        },
      },
    },
  });

  // 9. Create Sales Orders
  console.log('📈 Creating sales orders...');
  const soDates = [
    new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    new Date(),
  ];

  // SO 1: FULFILLED (Completed)
  const so1 = await prisma.order.create({
    data: {
      orderNumber: 'SO-2026-0001',
      type: OrderType.SALES,
      status: OrderStatus.FULFILLED,
      customerName: 'Delhi Electronics Mart',
      customerContact: '+919876543210',
      notes: 'Bulk consumer order dispatched successfully',
      totalAmount: 110000.0,
      createdById: staffUser.id,
      createdAt: soDates[0],
      lineItems: {
        create: [
          { productId: products[0].id, quantity: 2, unitPrice: 55000.0, subtotal: 110000.0 }, // Laptop
        ],
      },
      statusHistory: {
        createMany: {
          data: [
            { status: OrderStatus.DRAFT, notes: 'Cart draft saved', createdAt: soDates[0] },
            { status: OrderStatus.CONFIRMED, notes: 'Payment confirmed online', createdAt: new Date(soDates[0].getTime() + 30 * 60 * 1000) },
            { status: OrderStatus.SHIPPED, notes: 'Handed over to Delhi logistics', createdAt: new Date(soDates[0].getTime() + 12 * 60 * 60 * 1000) },
            { status: OrderStatus.FULFILLED, notes: 'Delivered and acknowledged', createdAt: new Date(soDates[0].getTime() + 36 * 60 * 60 * 1000) },
          ],
        },
      },
    },
  });

  // SO 2: SHIPPED
  const so2 = await prisma.order.create({
    data: {
      orderNumber: 'SO-2026-0002',
      type: OrderType.SALES,
      status: OrderStatus.SHIPPED,
      customerName: 'Aditya Clothing Hub',
      customerContact: '+919988776655',
      notes: 'Boutique order items',
      totalAmount: 11495.0,
      createdById: staffUser.id,
      createdAt: soDates[1],
      lineItems: {
        create: [
          { productId: products[5].id, quantity: 5, unitPrice: 999.0, subtotal: 4995.0 },  // T-Shirt
          { productId: products[6].id, quantity: 1, unitPrice: 2499.0, subtotal: 2499.0 }, // Jeans
          { productId: products[8].id, quantity: 1, unitPrice: 3999.0, subtotal: 3999.0 }, // Shoes
        ],
      },
      statusHistory: {
        createMany: {
          data: [
            { status: OrderStatus.DRAFT, notes: 'Draft invoice', createdAt: soDates[1] },
            { status: OrderStatus.CONFIRMED, notes: 'Approved for packing', createdAt: new Date(soDates[1].getTime() + 1 * 60 * 60 * 1000) },
            { status: OrderStatus.SHIPPED, notes: 'Dispatched via Gati Courier', createdAt: new Date(soDates[1].getTime() + 18 * 60 * 60 * 1000) },
          ],
        },
      },
    },
  });

  // SO 3: CONFIRMED
  const so3 = await prisma.order.create({
    data: {
      orderNumber: 'SO-2026-0003',
      type: OrderType.SALES,
      status: OrderStatus.CONFIRMED,
      customerName: 'Star Retailers Bangalore',
      customerContact: '+918045612398',
      notes: 'Corporate hardware gifts purchase',
      totalAmount: 32000.0,
      createdById: staffUser.id,
      createdAt: soDates[2],
      lineItems: {
        create: [
          { productId: products[1].id, quantity: 1, unitPrice: 20000.0, subtotal: 20000.0 }, // Smartphone
          { productId: products[2].id, quantity: 1, unitPrice: 12000.0, subtotal: 12000.0 }, // Monitor
        ],
      },
      statusHistory: {
        createMany: {
          data: [
            { status: OrderStatus.DRAFT, notes: 'Quote saved', createdAt: soDates[2] },
            { status: OrderStatus.CONFIRMED, notes: 'Order approved, awaiting dispatch', createdAt: new Date(soDates[2].getTime() + 3 * 60 * 60 * 1000) },
          ],
        },
      },
    },
  });

  // SO 4: DRAFT
  const so4 = await prisma.order.create({
    data: {
      orderNumber: 'SO-2026-0004',
      type: OrderType.SALES,
      status: OrderStatus.DRAFT,
      customerName: 'Shanti Groceries',
      customerContact: '+917531598426',
      notes: 'Standard grocery requirements',
      totalAmount: 4800.0,
      createdById: staffUser.id,
      createdAt: soDates[3],
      lineItems: {
        create: [
          { productId: products[10].id, quantity: 10, unitPrice: 480.0, subtotal: 4800.0 }, // Coffee Jars
        ],
      },
      statusHistory: {
        create: {
          status: OrderStatus.DRAFT,
          notes: 'Customer cart drafted',
          createdAt: soDates[3],
        },
      },
    },
  });

  // SO 5: CANCELLED
  const so5 = await prisma.order.create({
    data: {
      orderNumber: 'SO-2026-0005',
      type: OrderType.SALES,
      status: OrderStatus.CANCELLED,
      customerName: 'Mumbai Technical Academy',
      customerContact: '+912285479632',
      notes: 'Out of stock cancellation',
      totalAmount: 3800.0,
      createdById: adminUser.id,
      createdAt: soDates[4],
      lineItems: {
        create: [
          { productId: products[20].id, quantity: 1, unitPrice: 3800.0, subtotal: 3800.0 }, // Drill
        ],
      },
      statusHistory: {
        createMany: {
          data: [
            { status: OrderStatus.DRAFT, notes: 'Quote prepared', createdAt: soDates[4] },
            { status: OrderStatus.CANCELLED, notes: 'Cancelled due to inventory shortage', createdAt: new Date(soDates[4].getTime() + 45 * 60 * 1000) },
          ],
        },
      },
    },
  });

  // 10. Seed Stock Movement History (spanning last 30 days)
  console.log('📊 Seeding stock movements logs...');
  // Add PO 1 and SO 1 movements first
  await prisma.stockMovement.create({
    data: {
      productId: products[0].id, // Laptop
      type: MovementType.INBOUND,
      quantity: 3,
      previousStock: 14,
      newStock: 17,
      reason: 'Received PO Order: PO-2026-0001',
      referenceId: po1.id,
      createdById: managerUser.id,
      createdAt: new Date(poDates[0].getTime() + 48 * 60 * 60 * 1000),
    },
  });

  await prisma.stockMovement.create({
    data: {
      productId: products[0].id, // Laptop
      type: MovementType.OUTBOUND,
      quantity: 2,
      previousStock: 17,
      newStock: 15,
      reason: 'Fulfilled SO Order: SO-2026-0001',
      referenceId: so1.id,
      createdById: staffUser.id,
      createdAt: new Date(soDates[0].getTime() + 36 * 60 * 60 * 1000),
    },
  });

  // Add random historical logs for graphs
  const now = new Date();
  const movementReasons = [
    { type: MovementType.INBOUND, reason: 'Restock check' },
    { type: MovementType.OUTBOUND, reason: 'Walk-in sales count' },
    { type: MovementType.ADJUSTMENT, reason: 'Physical inventory audit correction' },
    { type: MovementType.INBOUND, reason: 'Supplier excess items correction' },
    { type: MovementType.OUTBOUND, reason: 'Defective units removal' },
  ];

  for (let i = 1; i <= 30; i++) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const reasonItem = movementReasons[Math.floor(Math.random() * movementReasons.length)];

    const date = new Date();
    date.setDate(now.getDate() - Math.floor(Math.random() * 28) - 1); // 1 to 29 days ago

    const previousStock = Math.floor(Math.random() * 20) + 10;
    const quantity = Math.floor(Math.random() * 5) + 1;
    let newStock = previousStock;

    if (reasonItem.type === MovementType.INBOUND) {
      newStock = previousStock + quantity;
    } else if (reasonItem.type === MovementType.OUTBOUND) {
      newStock = previousStock - quantity;
    } else if (reasonItem.type === MovementType.ADJUSTMENT) {
      newStock = previousStock + (i % 2 === 0 ? quantity : -quantity);
    }

    await prisma.stockMovement.create({
      data: {
        productId: randomProduct.id,
        type: reasonItem.type,
        quantity: Math.abs(newStock - previousStock),
        previousStock,
        newStock,
        reason: reasonItem.reason,
        createdById: randomUser.id,
        createdAt: date,
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
