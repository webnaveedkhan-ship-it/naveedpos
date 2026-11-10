const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize resilient database connection
connectDB();

const app = express();

// Trust reverse proxy (Render.com, Railway, Vercel, Cloudflare, NGINX)
// Essential for secure cookie handling, HTTPS detection, and client IP resolution
app.set('trust proxy', 1);

// Security Headers via Helmet (optimized for REST APIs and CDN assets)
app.use(
  helmet({
    contentSecurityPolicy: false, // REST JSON API does not serve executable HTML scripts
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows cross-origin image sharing & CDN previews
  })
);

// Gzip Compression for high-throughput responses
app.use(compression());

// HTTP request logger (disabled during test runs)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Cookie parser
app.use(cookieParser());

// Body parser
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Strict Production Security & CORS Policy
const configuredClientUrls = (process.env.CLIENT_URL || '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:5172',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5371',
  'http://localhost:3000',
  'http://127.0.0.1:5172',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5371',
  ...configuredClientUrls,
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server, curl, Postman, health checkers without origin
      if (!origin) return callback(null, true);

      // Local development or exact whitelisted origin
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      const isAllowed = allowedOrigins.includes(origin);

      // Allow Vercel / Netlify preview & production deployments
      const isVercelOrNetlify = /^https:\/\/[a-zA-Z0-9_-]+(\.vercel\.app|\.netlify\.app)$/.test(origin);

      if (isLocalhost || isAllowed || isVercelOrNetlify || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy: Origin '${origin}' is not permitted by access control policy.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
  })
);

// Serve static uploaded files (legacy container fallback)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint for cloud load balancers and container orchestrators
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    service: 'NaveedPOS Multi-Tenant SaaS Platform API',
    database: global.useMemoryStore ? 'in-memory-pos-store' : 'mongodb-cluster',
    environment: process.env.NODE_ENV || 'production',
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/super-admin', require('./routes/superAdminRoutes'));
app.use('/api/broadcast', require('./routes/broadcastRoutes'));
app.use('/api/tenants', require('./routes/tenantRoutes'));
app.use('/api/khata', require('./routes/khataRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/cash-drawer', require('./routes/cashDrawerRoutes'));
app.use('/api/backup', require('./routes/backupRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5055;

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 NaveedPOS Multi-Tenant SaaS Server running on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🛡️  Security: Helmet, Gzip Compression, Strict CORS Active`);
    console.log(`==================================================\n`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
  });
}

module.exports = app;
