const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { uploadToCloud } = require('../services/cloudStorageService');

/**
 * @desc    Upload an image file (product photo, payment slip, logo) to cloud CDN
 * @route   POST /api/upload
 * @access  Private (Authenticated users)
 */
router.post('/', protect, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please send a file field named "file".',
      });
    }

    const folder = req.body.folder || 'general';
    const result = await uploadToCloud(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully to cloud CDN',
      url: result.url,
      provider: result.provider,
      fileId: result.fileId || null,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
