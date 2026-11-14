const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getProductBySku,
  getLowStockProducts,
  quickRestock,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  seedDummyProducts,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantGuard = require('../middleware/tenantGuard');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);
router.use(tenantGuard);

// Demo Products Seeder
router.post('/seed-dummy', seedDummyProducts);
router.post('/seed', seedDummyProducts);

// Low Stock & Metadata
router.get('/low-stock', getLowStockProducts);
router.get('/meta/categories', getCategories);
router.get('/categories', getCategories);
router.get('/sku/:sku', getProductBySku);

// Quick Inline Restock
router.patch('/:id/restock', authorize('STORE_ADMIN'), quickRestock);

// Products CRUD
router
  .route('/')
  .get(getProducts)
  .post(authorize('STORE_ADMIN'), upload.single('image'), createProduct);

router
  .route('/:id')
  .get(getProductById)
  .put(authorize('STORE_ADMIN'), upload.single('image'), updateProduct)
  .delete(authorize('STORE_ADMIN'), deleteProduct);

module.exports = router;
