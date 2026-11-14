const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Tenant = require('../models/Tenant');
const { getDummyProducts } = require('../config/dummyProducts');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedDatabase = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/naveedpos';

    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB Connected for Seeding.');

    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await Order.deleteMany();
    await Tenant.deleteMany();

    console.log('Existing collections cleared.');

    // 1. Seed Default Store Tenant (Al-Madina Superstore)
    const defaultTenant = await Tenant.create({
      name: 'Al-Madina Superstore (Lahore)',
      slug: 'al-madina-lahore',
      ownerEmail: 'admin@naveedpos.com',
      phone: '+92 300 1234567',
      city: 'Lahore',
      status: 'active',
      plan: 'standard',
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      settings: {
        currency: 'PKR',
        currencySymbol: 'Rs.',
        taxRate: 0,
        receiptHeader: 'Al-Madina Superstore Lahore',
        address: 'Shop #14, Main Commercial Boulevard, Lahore',
        receiptFooter: 'Thank You For Shopping at Al-Madina! Returns accepted within 7 days.',
        phone: '+92 300 1234567',
      },
    });

    console.log(`Tenant created: ${defaultTenant.name} [${defaultTenant._id}]`);

    // 2. Seed Users
    const adminUser = await User.create({
      name: 'Naveed Admin',
      email: 'admin@naveedpos.com',
      password: 'admin123',
      role: 'STORE_OWNER',
      tenantId: defaultTenant._id,
      status: 'active',
      phone: '+92 300 1234567',
    });

    const cashierUser = await User.create({
      name: 'Sarah Cashier',
      email: 'cashier@naveedpos.com',
      password: 'cashier123',
      role: 'CASHIER',
      tenantId: defaultTenant._id,
      status: 'active',
      phone: '+92 321 9876543',
    });

    console.log('Users seeded:');
    console.log(' - Store Owner: admin@naveedpos.com / admin123');
    console.log(' - Cashier: cashier@naveedpos.com / cashier123');

    // 3. Seed Categories
    const categoriesData = [
      { name: 'Beverages', color: '#0284c7', description: 'Soft drinks, juices, energy drinks and water' },
      { name: 'Groceries & Pantry', color: '#ca8a04', description: 'Spices, grains, pasta, sauces and essentials' },
      { name: 'Dairy & Fresh', color: '#16a34a', description: 'Milk, yogurts, cheese and butter' },
      { name: 'Snacks & Bakery', color: '#ea580c', description: 'Chips, biscuits, fresh pastries and confectionery' },
      { name: 'Garments & Footwear', color: '#ec4899', description: 'Kameez shalwar, shirts, shoes, and chappals' },
      { name: 'Personal Care', color: '#db2777', description: 'Soaps, shampoos, oral care and sanitizers' },
      { name: 'Electronics & Acc.', color: '#7c3aed', description: 'Cables, chargers, headphones and powerbanks' },
    ];

    await Category.insertMany(categoriesData);
    console.log('Categories seeded.');

    // 4. Seed Products in Pakistani Rupee (PKR / Rs.)
    const productsData = getDummyProducts(defaultTenant._id).map((p) => {
      const { _id, ...rest } = p;
      return rest;
    });

    const seededProducts = await Product.insertMany(productsData);
    console.log(`Products seeded: ${seededProducts.length} items (with variants & image URLs).`);

    // 5. Seed sample completed order
    const sampleOrders = [
      {
        tenantId: defaultTenant._id,
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
            subtotal: seededProducts[0].price * 2,
          },
          {
            product: seededProducts[5]._id,
            title: seededProducts[5].title,
            sku: seededProducts[5].sku,
            price: seededProducts[5].price,
            costPrice: seededProducts[5].costPrice,
            quantity: 1,
            subtotal: seededProducts[5].price,
          },
        ],
        subtotal: seededProducts[0].price * 2 + seededProducts[5].price,
        taxRate: 0,
        taxAmount: 0,
        discountType: 'fixed',
        discountValue: 0,
        discountAmount: 0,
        grandTotal: seededProducts[0].price * 2 + seededProducts[5].price,
        paymentMethod: 'cash',
        paymentDetails: { cashTendered: 3000, changeGiven: 3000 - (seededProducts[0].price * 2 + seededProducts[5].price) },
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
