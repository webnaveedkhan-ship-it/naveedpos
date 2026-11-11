const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');

const SUPERADMIN_NAME = process.env.SUPERADMIN_NAME || 'Naveed (Platform Owner)';
const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'naveed@naveedpos.com').toLowerCase().trim();
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'admin123';

async function seedSuperAdmin() {
  console.log('\n======================================================');
  console.log('🛡️  NaveedPOS SaaS: Safe Super Admin CLI Provisioner');
  console.log('======================================================\n');

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/naveedpos';

  try {
    console.log(`📡 Connecting to MongoDB at: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':$1***@')}...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('✅ Connected to MongoDB successfully.\n');

    // Check if a Super Admin account already exists
    const existingSuperAdmin = await User.findOne({
      $or: [{ email: SUPERADMIN_EMAIL }, { role: 'SUPER_ADMIN' }],
    });

    if (existingSuperAdmin) {
      console.log('ℹ️  Super Admin account already exists:');
      console.log(`   - Name:     ${existingSuperAdmin.name}`);
      console.log(`   - Email:    ${existingSuperAdmin.email}`);
      console.log(`   - Role:     ${existingSuperAdmin.role}`);
      console.log(`   - TenantId: ${existingSuperAdmin.tenantId || 'null (Global Platform Scope)'}`);
      console.log(`   - Status:   ${existingSuperAdmin.isActive ? 'Active' : 'Inactive'}`);
      console.log('\n✨ No action required. Super Admin is ready to log in.\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create new Super Admin account
    console.log('🌱 Provisioning fresh Super Admin account...');
    const superAdmin = await User.create({
      name: SUPERADMIN_NAME,
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
      role: 'SUPER_ADMIN',
      tenantId: null,
      isActive: true,
      status: 'active',
      phone: '+92 300 0000000',
    });

    console.log('🎉 Super Admin created successfully!');
    console.log(`   - Name:     ${superAdmin.name}`);
    console.log(`   - Email:    ${superAdmin.email}`);
    console.log(`   - Role:     ${superAdmin.role}`);
    console.log(`   - TenantId: null (Global Platform Scope)`);
    console.log('\n🔐 You can now log into the Super Admin console with:');
    console.log(`   Email:    ${SUPERADMIN_EMAIL}`);
    console.log(`   Password: (from SUPERADMIN_PASSWORD or default admin123)\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.warn(`⚠️  MongoDB connection error: ${error.message}`);
    console.log('\n[Offline / Fallback Notice]:');
    console.log('If you are running in offline/memory mode, the Super Admin account');
    console.log(`("${SUPERADMIN_EMAIL}") is already automatically available in memoryStore.js.`);
    console.log('Start the server using `npm start` and sign in with admin123.\n');
    process.exit(0);
  }
}

seedSuperAdmin();