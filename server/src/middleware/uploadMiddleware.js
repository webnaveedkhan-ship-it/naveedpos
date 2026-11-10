const multer = require('multer');
const path = require('path');

// Memory storage keeps file buffers in RAM, preventing ephemeral container disk wipes on Render/Railway
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|webp|svg|gif/;
  const mimetypes = /image\/(jpe?g|png|webp|svg\+xml|gif)/;

  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = mimetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only (jpg, jpeg, png, webp, svg allowed)!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max for high-res receipts and product photos
  fileFilter,
});

module.exports = upload;
