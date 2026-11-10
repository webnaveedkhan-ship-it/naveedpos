const ImageKit = require('imagekit');

/**
 * Cloud Storage Service for NaveedPOS
 * Handles persistent CDN uploads to ImageKit.io or Cloudinary
 * Eliminates ephemeral local disk dependencies.
 */

let imagekitClient = null;

const getImageKitClient = () => {
  if (imagekitClient) return imagekitClient;

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (publicKey && privateKey && urlEndpoint) {
    try {
      imagekitClient = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
      });
      console.log('☁️ [CloudStorage]: ImageKit.io client initialized.');
      return imagekitClient;
    } catch (err) {
      console.warn('⚠️ [CloudStorage]: Failed to initialize ImageKit client:', err.message);
    }
  }

  return null;
};

/**
 * Uploads a file buffer or base64 string to persistent cloud media storage.
 * @param {Buffer|string} fileSource - Buffer or base64 string of file
 * @param {string} originalname - Original file name
 * @param {string} mimetype - MIME type (e.g. image/jpeg, image/png)
 * @param {string} folder - Destination folder on cloud (e.g. 'products', 'receipts')
 * @returns {Promise<{ url: string, fileId?: string, provider: string }>}
 */
const uploadToCloud = async (fileSource, originalname = 'upload.jpg', mimetype = 'image/jpeg', folder = 'general') => {
  const ik = getImageKitClient();

  // 1. Primary: ImageKit.io Cloud Upload
  if (ik) {
    try {
      const cleanFileName = `pos_${Date.now()}_${originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const uploadResponse = await ik.upload({
        file: fileSource, // supports Buffer or base64 string
        fileName: cleanFileName,
        folder: `/naveedpos/${folder}`,
        useUniqueFileName: true,
      });

      return {
        url: uploadResponse.url,
        fileId: uploadResponse.fileId,
        provider: 'imagekit',
      };
    } catch (error) {
      console.error('❌ [CloudStorage]: ImageKit upload failed, falling back:', error.message);
    }
  }

  // 2. Fallback for Zero-Config Local Development & Automated Tests:
  // Convert buffer to data URI without touching the container disk.
  if (Buffer.isBuffer(fileSource)) {
    const base64Data = fileSource.toString('base64');
    const safeMime = mimetype || 'image/jpeg';
    return {
      url: `data:${safeMime};base64,${base64Data}`,
      provider: 'memory-base64',
    };
  }

  // If already a string (URL or data URL)
  if (typeof fileSource === 'string') {
    return {
      url: fileSource,
      provider: 'direct',
    };
  }

  return {
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop',
    provider: 'placeholder',
  };
};

module.exports = {
  uploadToCloud,
  getImageKitClient,
};
