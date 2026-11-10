const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/naveedpos';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB Connected for Seeding.');

    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await Order.deleteMany();

    console.log('Existing collections cleared.');

    // 1. Seed Users
    const adminUser = await User.create({
      name: 'Naveed Admin',
      email: 'admin@naveedpos.com',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      phone: '+92 300 1234567',
    });

    const cashierUser = await User.create({
      name: 'Sarah Cashier',
      email: 'cashier@naveedpos.com',
      password: 'cashier123',
      role: 'cashier',
      status: 'active',
      phone: '+92 321 9876543',
    });

    console.log('Users seeded:');
    console.log(' - Admin: admin@naveedpos.com / admin123');
    console.log(' - Cashier: cashier@naveedpos.com / cashier123');

    // 2. Seed Categories
    const categoriesData = [
      { name: 'Beverages', color: '#0284c7', description: 'Soft drinks, juices, energy drinks and water' },
      { name: 'Snacks & Bakery', color: '#ea580c', description: 'Chips, biscuits, fresh pastries and confectionery' },
      { name: 'Dairy & Fresh', color: '#16a34a', description: 'Milk, yogurts, cheese and butter' },
      { name: 'Electronics & Acc.', color: '#7c3aed', description: 'Cables, chargers, headphones and powerbanks' },
      { name: 'Personal Care', color: '#db2777', description: 'Soaps, shampoos, oral care and sanitizers' },
      { name: 'Groceries & Pantry', color: '#ca8a04', description: 'Spices, grains, pasta, sauces and essentials' },
    ];

    await Category.insertMany(categoriesData);
    console.log('Categories seeded.');

    // 3. Seed Products in Pakistani Rupee (PKR / Rs.)
    const productsData = [
      // Beverages
      {
        title: 'Artisan Cold Brew Coffee 330ml',
        sku: 'BEV-001',
        category: 'Beverages',
        price: 450,
        costPrice: 260,
        stockQuantity: 4,
        lowStockAlert: 8,
        description: 'Smooth slow-steeped organic arabica cold brew',
      },
      {
        title: 'Sparkling Mineral Water 500ml',
        sku: 'BEV-002',
        category: 'Beverages',
        price: 120,
        costPrice: 65,
        stockQuantity: 48,
        lowStockAlert: 10,
        description: 'Naturally effervescent spring water',
      },
      {
        title: 'Organic Green Tea 400ml',
        sku: 'BEV-003',
        category: 'Beverages',
        price: 180,
        costPrice: 95,
        stockQuantity: 28,
        lowStockAlert: 8,
        description: 'Unsweetened Japanese sencha iced tea',
      },
      {
        title: 'Fresh Squeezed Orange Juice 1L',
        sku: 'BEV-004',
        category: 'Beverages',
        price: 550,
        costPrice: 350,
        stockQuantity: 15,
        lowStockAlert: 5,
        description: '100% pure squeezed valencia orange juice with pulp',
      },
      {
        title: 'Energy Fuel Drink 250ml',
        sku: 'BEV-005',
        category: 'Beverages',
        price: 320,
        costPrice: 180,
        stockQuantity: 36,
        lowStockAlert: 10,
        description: 'Citrus taurine & b-vitamin boost',
      },

      // Snacks & Bakery
      {
        title: 'Truffle Sea Salt Kettle Chips 150g',
        sku: 'SNK-001',
        category: 'Snacks & Bakery',
        price: 290,
        costPrice: 160,
        stockQuantity: 22,
        lowStockAlert: 6,
        description: 'Crispy hand-cooked artisan potato chips',
      },
      {
        title: 'Dark Chocolate Almond Bar 85g',
        sku: 'SNK-002',
        category: 'Snacks & Bakery',
        price: 350,
        costPrice: 210,
        stockQuantity: 3,
        lowStockAlert: 10,
        description: '72% single-origin dark chocolate with roasted almonds',
      },
      {
        title: 'Fresh Butter Croissant',
        sku: 'SNK-003',
        category: 'Snacks & Bakery',
        price: 240,
        costPrice: 110,
        stockQuantity: 18,
        lowStockAlert: 5,
        description: 'Flaky baked daily French croissant',
      },
      {
        title: 'Organic Trail Mix 200g',
        sku: 'SNK-004',
        category: 'Snacks & Bakery',
        price: 650,
        costPrice: 400,
        stockQuantity: 14,
        lowStockAlert: 5,
        description: 'Cranberries, walnuts, cashews, and pumpkin seeds',
      },

      // Dairy & Fresh
      {
        title: 'Whole Organic Milk 1 Litre',
        sku: 'DAR-001',
        category: 'Dairy & Fresh',
        price: 290,
        costPrice: 240,
        stockQuantity: 25,
        lowStockAlert: 6,
        description: 'Farm-fresh pasteurized organic whole milk',
      },
      {
        title: 'Greek Yogurt Honey Vanilla 500g',
        sku: 'DAR-002',
        category: 'Dairy & Fresh',
        price: 420,
        costPrice: 280,
        stockQuantity: 12,
        lowStockAlert: 5,
        description: 'High protein strained whole milk Greek yogurt',
      },
      {
        title: 'Aged White Cheddar Cheese 250g',
        sku: 'DAR-003',
        category: 'Dairy & Fresh',
        price: 850,
        costPrice: 550,
        stockQuantity: 2,
        lowStockAlert: 5,
        description: 'Sharp 18-month aged artisan white cheddar',
      },

      // Electronics & Accessories
      {
        title: 'Braided Fast USB-C Cable 2M',
        sku: 'ELC-001',
        category: 'Electronics & Acc.',
        price: 1150,
        costPrice: 550,
        stockQuantity: 30,
        lowStockAlert: 5,
        description: '100W PD nylon braided durable charging cable',
      },
      {
        title: 'Compact 30W Dual USB Wall Charger',
        sku: 'ELC-002',
        category: 'Electronics & Acc.',
        price: 2400,
        costPrice: 1400,
        stockQuantity: 8,
        lowStockAlert: 4,
        description: 'GaN high efficiency fast wall adapter',
      },

      // Personal Care
      {
        title: 'Moisturizing Aloe Vera Hand Wash 300ml',
        sku: 'PER-001',
        category: 'Personal Care',
        price: 450,
        costPrice: 250,
        stockQuantity: 24,
        lowStockAlert: 6,
        description: 'Hydrating antibacterial botanical liquid soap',
      },

      // Groceries & Pantry
      {
        title: 'Extra Virgin Olive Oil Cold Pressed 750ml',
        sku: 'GRO-001',
        category: 'Groceries & Pantry',
        price: 2900,
        costPrice: 1950,
        stockQuantity: 11,
        lowStockAlert: 4,
        description: 'First cold pressed Mediterranean olive oil',
      },
    ];

    const seededProducts = await Product.insertMany(productsData);
    console.log(`Products seeded: ${seededProducts.length} items.`);

    // 4. Seed sample completed orders
    const sampleOrders = [
      {
        orderNumber: 'NPOS-261107-1011',
        cashier: cashierUser._id,
        cashierName: cashierUser.name,
        items: [
          {
            product: seededProducts[0]._id,
            title: seededProducts[0].title,
            sku: seededProducts[0].sku,
            price: seededProducts[0].price,
            costPrice: seededProducts[0].costPrice,
            quantity: 2,
            subtotal: 900,
          },
          {
            product: seededProducts[5]._id,
            title: seededProducts[5].title,
            sku: seededProducts[5].sku,
            price: seededProducts[5].price,
            costPrice: seededProducts[5].costPrice,
            quantity: 1,
            subtotal: 290,
          },
        ],
        subtotal: 1190,
        taxRate: 5,
        taxAmount: 59.5,
        discountType: 'fixed',
        discountValue: 0,
        discountAmount: 0,
        grandTotal: 1249.5,
        paymentMethod: 'cash',
        paymentDetails: { cashTendered: 1500, changeGiven: 250.5 },
        customer: { name: 'Muhammad Ali', phone: '+92-300-5551234' },
        createdAt: new Date(),
        status: 'completed',
      },
    ];

    await Order.insertMany(sampleOrders);
    console.log(`Sample orders seeded.`);
    console.log('\n[SUCCESS] NaveedPOS Database Seeding Completed in PKR!');
    process.exit(0);
  } catch (error) {
    console.error('[ERROR Seeding Database]:', error);
    process.exit(1);
  }
};

seedDatabase();
