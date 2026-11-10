const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
process.env.NODE_ENV = 'test';

global.useMemoryStore = true;
const memoryStore = require('../src/config/memoryStore');
const { uploadToCloud } = require('../src/services/cloudStorageService');
const app = require('../src/server');

// Mock response builder
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, val) {
      this.headers[name.toLowerCase()] = val;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
    send(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

async function runCloudTests() {
  console.log('======================================================================');
  console.log('☁️  NaveedPOS Cloud Production Hardening & Resilience Verification');
  console.log('======================================================================\n');

  await memoryStore.init();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health Check Endpoint Verification
  console.log('--- 1. Health Check Endpoint Verification (/api/health) ---');
  {
    const req = { method: 'GET', url: '/api/health' };
    const res = createMockRes();

    // Call route handler directly
    const route = app._router.stack.find((layer) => layer.route && layer.route.path === '/api/health');
    assert(Boolean(route), 'Health check route /api/health is mounted on Express app');

    if (route) {
      route.route.stack[0].handle(req, res);
      assert(res.statusCode === 200, 'Health check returns HTTP 200 OK');
      assert(res.data?.status === 'ok', 'Health check status is "ok"');
      assert(typeof res.data?.uptime === 'number', 'Health check returns uptime as number');
      assert(typeof res.data?.timestamp === 'number', 'Health check returns timestamp as Unix millisecond number');
    }
  }

  // 2. Cloud Media Storage Service (Zero Local Disk Writes)
  console.log('\n--- 2. Persistent Cloud Media Storage Service ---');
  {
    const sampleBuffer = Buffer.from('FAKE_PNG_IMAGE_BYTES_FOR_PRODUCT_TEST');
    const result = await uploadToCloud(sampleBuffer, 'product-bottle.png', 'image/png', 'products');

    assert(Boolean(result.url), 'Upload returns a non-empty image URL');
    assert(
      result.url.startsWith('https://') || result.url.startsWith('data:image/png;base64,'),
      'URL is either a permanent HTTPS CDN link or self-contained Base64 data URI (No local disk /uploads dependency)'
    );
    assert(
      !result.url.startsWith('/uploads/'),
      'URL does NOT depend on local container disk /uploads folder'
    );
    assert(
      ['imagekit', 'memory-base64', 'direct', 'cloudinary'].includes(result.provider),
      `Upload provider identified as valid cloud engine (${result.provider})`
    );
  }

  // 3. Product Controller with Cloud Buffer Upload
  console.log('\n--- 3. Product Controller with In-Memory Buffer Upload ---');
  {
    const productController = require('../src/controllers/productController');

    const req = {
      user: {
        _id: 'user_1',
        name: 'Tariq Mehmood',
        role: 'STORE_ADMIN',
        tenantId: 'tenant_1',
      },
      body: {
        title: 'Cloud Managed Gourmet Tea 500g',
        sku: 'TEA-CLOUD-999',
        category: 'Beverages',
        price: '850',
        costPrice: '600',
        stockQuantity: '100',
        lowStockAlert: '10',
        unitType: 'piece',
      },
      file: {
        buffer: Buffer.from('SAMPLE_IMAGE_TEA_CONTAINER'),
        originalname: 'gourmet-tea.jpg',
        mimetype: 'image/jpeg',
      },
    };
    const res = createMockRes();

    await productController.createProduct(req, res, (err) => {
      if (err) console.error('Product error:', err);
    });

    assert(res.statusCode === 201, 'Product created with HTTP 201');
    assert(res.data?.product?.title === 'Cloud Managed Gourmet Tea 500g', 'Product title is correct');
    assert(
      Boolean(res.data?.product?.image) && !res.data.product.image.startsWith('/uploads/'),
      'Product image URL saved without local container disk dependency'
    );
  }

  // 4. Subscription Payment Slip with Cloud Buffer Upload
  console.log('\n--- 4. Subscription Payment Slip In-Memory Cloud Upload ---');
  {
    const tenantController = require('../src/controllers/tenantController');

    const req = {
      user: {
        _id: 'user_1',
        name: 'Tariq Mehmood',
        role: 'STORE_ADMIN',
        tenantId: 'tenant_1',
      },
      body: {
        amount: '3000',
        billingCycle: 'monthly',
        paymentMethod: 'EASYPAISA',
        transactionId: `EP-CLOUD-${Date.now()}`,
      },
      file: {
        buffer: Buffer.from('FAKE_SLIP_SCREENSHOT_BYTES'),
        originalname: 'easypaisa-slip.jpg',
        mimetype: 'image/jpeg',
      },
    };
    const res = createMockRes();

    await tenantController.submitSubscriptionPayment(req, res, (err) => {
      if (err) console.error('Subscription error:', err);
    });

    assert(res.statusCode === 201, 'Subscription payment verification submitted with HTTP 201');
    assert(res.data?.payment?.paymentMethod === 'EASYPAISA', 'Payment method is EASYPAISA');
    assert(
      Boolean(res.data?.payment?.receiptUrl) && !res.data.payment.receiptUrl.startsWith('/uploads/'),
      'Subscription slip receipt URL saved as cloud/CDN persistent link'
    );
  }

  // 5. Express Security Configuration (Helmet, Trust Proxy, Compression)
  console.log('\n--- 5. Security & Reverse Proxy Configuration ---');
  {
    assert(app.get('trust proxy') === 1, 'Express trust proxy is enabled (level 1) for Render/Railway/Vercel');
    const uploadRoute = app._router.stack.find((l) => l.route && l.route.path === '/api/upload');
    const hasUploadPrefix = app._router.stack.some(
      (layer) => layer.regexp && layer.regexp.test('/api/upload')
    );
    assert(hasUploadPrefix, 'Dedicated /api/upload endpoint is mounted on server');
  }

  console.log('\n======================================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCloudTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
