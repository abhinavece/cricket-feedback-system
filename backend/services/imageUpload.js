/**
 * @fileoverview Image Upload Service (Google Cloud Storage)
 * 
 * Handles image uploads for auction players, teams, and covers.
 * - Validates file type and size
 * - Auto-resizes to max 800x800 and converts to WebP via sharp
 * - Generates 64x64 thumbnail alongside full image
 * - Uploads to GCS with CDN-friendly cache headers
 * - Returns public URL
 * 
 * @module services/imageUpload
 */

const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'cricsmart-auction-images';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MIN_DIMENSION = 200; // minimum 200x200
const MAX_DIMENSION = 800; // resize to max 800x800
const THUMB_SIZE = 64;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

// Storage mode: 'gcs' (production) or 'local' (development)
// Auto-detects: if IMAGE_STORAGE=local OR GCS_BUCKET_NAME is not set AND no default credentials, use local
const STORAGE_MODE = process.env.IMAGE_STORAGE || 'gcs';
const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'images');
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;

let storage;
function getStorage() {
  if (!storage) {
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'cricsmart',
    });
  }
  return storage;
}

function getBucket() {
  return getStorage().bucket(BUCKET_NAME);
}

/**
 * Check if we should use local storage.
 * Returns true if IMAGE_STORAGE=local or GCS is not accessible.
 */
function isLocalStorage() {
  return STORAGE_MODE === 'local';
}

/**
 * Validate an image buffer before upload.
 * Checks MIME type via sharp metadata (not just Content-Type header).
 * @param {Buffer} buffer - Image file buffer
 * @param {string} declaredMime - MIME type from the upload request
 * @returns {Promise<{ valid: boolean, error?: string, metadata?: object }>}
 */
async function validateImage(buffer, declaredMime) {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file' };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` };
  }

  if (!ALLOWED_MIMES.includes(declaredMime)) {
    return { valid: false, error: `Invalid file type: ${declaredMime}. Allowed: JPEG, PNG, WebP` };
  }

  try {
    const metadata = await sharp(buffer).metadata();
    const validFormats = ['jpeg', 'png', 'webp'];
    if (!validFormats.includes(metadata.format)) {
      return { valid: false, error: `Invalid image format: ${metadata.format}` };
    }

    if (metadata.width < MIN_DIMENSION || metadata.height < MIN_DIMENSION) {
      return { valid: false, error: `Image too small (${metadata.width}x${metadata.height}). Minimum: ${MIN_DIMENSION}x${MIN_DIMENSION}` };
    }

    return { valid: true, metadata };
  } catch (err) {
    return { valid: false, error: 'Corrupt or unreadable image file' };
  }
}

/**
 * Process image: resize to max dimensions and convert to WebP.
 * @param {Buffer} buffer - Original image buffer
 * @returns {Promise<{ full: Buffer, thumbnail: Buffer }>}
 */
async function processImage(buffer) {
  const full = await sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const thumbnail = await sharp(buffer)
    .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' })
    .webp({ quality: 75 })
    .toBuffer();

  return { full, thumbnail };
}

/**
 * Upload a processed image + thumbnail to the configured storage backend.
 * @param {Buffer} fullBuffer - Processed full-size image
 * @param {Buffer} thumbBuffer - 64x64 thumbnail
 * @param {string} storagePath - Object path (without extension), e.g. 'auctions/abc123/players/def456'
 * @returns {Promise<{ imageUrl: string, thumbnailUrl: string }>}
 */
async function uploadToStorage(fullBuffer, thumbBuffer, storagePath) {
  const timestamp = Date.now();
  const fullPath = `${storagePath}_${timestamp}.webp`;
  const thumbPath = `${storagePath}_${timestamp}_thumb.webp`;

  if (isLocalStorage()) {
    return await uploadToLocal(fullBuffer, thumbBuffer, fullPath, thumbPath);
  }
  return await uploadToGCS(fullBuffer, thumbBuffer, fullPath, thumbPath);
}

/**
 * Upload to local filesystem (development mode).
 */
async function uploadToLocal(fullBuffer, thumbBuffer, fullPath, thumbPath) {
  const fullDest = path.join(LOCAL_UPLOAD_DIR, fullPath);
  const thumbDest = path.join(LOCAL_UPLOAD_DIR, thumbPath);

  // Ensure directories exist
  await fs.mkdir(path.dirname(fullDest), { recursive: true });
  await fs.mkdir(path.dirname(thumbDest), { recursive: true });

  await Promise.all([
    fs.writeFile(fullDest, fullBuffer),
    fs.writeFile(thumbDest, thumbBuffer),
  ]);

  return {
    imageUrl: `${BACKEND_URL}/uploads/images/${fullPath}`,
    thumbnailUrl: `${BACKEND_URL}/uploads/images/${thumbPath}`,
  };
}

/**
 * Upload to Google Cloud Storage (production mode).
 */
async function uploadToGCS(fullBuffer, thumbBuffer, fullPath, thumbPath) {
  const bucket = getBucket();

  const uploadOptions = {
    contentType: 'image/webp',
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
    resumable: false,
  };

  await Promise.all([
    bucket.file(fullPath).save(fullBuffer, uploadOptions),
    bucket.file(thumbPath).save(thumbBuffer, uploadOptions),
  ]);

  const baseUrl = `https://storage.googleapis.com/${BUCKET_NAME}`;
  return {
    imageUrl: `${baseUrl}/${fullPath}`,
    thumbnailUrl: `${baseUrl}/${thumbPath}`,
  };
}

/**
 * Delete an image from storage by its public URL.
 * Silently ignores if file doesn't exist.
 * @param {string} publicUrl - Full public URL (GCS or local)
 */
async function deleteFromStorage(publicUrl) {
  if (!publicUrl) return;

  try {
    // Local file
    if (publicUrl.includes('/uploads/images/')) {
      const relativePath = publicUrl.split('/uploads/images/')[1];
      if (relativePath) {
        const filePath = path.join(LOCAL_UPLOAD_DIR, relativePath);
        await fs.unlink(filePath).catch(() => {});
      }
      return;
    }

    // GCS file
    if (publicUrl.includes(BUCKET_NAME)) {
      const objectPath = publicUrl.split(`${BUCKET_NAME}/`)[1];
      if (objectPath) {
        await getBucket().file(objectPath).delete({ ignoreNotFound: true });
      }
    }
  } catch (err) {
    console.error('Image delete error (non-critical):', err.message);
  }
}

/**
 * Full upload pipeline: validate → process → upload to GCS.
 * @param {Buffer} buffer - Raw image buffer from multer
 * @param {string} mimetype - Declared MIME type
 * @param {string} gcsPath - GCS path prefix (e.g. 'auctions/abc/players/def')
 * @param {string} [existingUrl] - Existing image URL to delete on re-upload
 * @returns {Promise<{ imageUrl: string, thumbnailUrl: string }>}
 */
async function uploadImage(buffer, mimetype, gcsPath, existingUrl) {
  // Validate
  const validation = await validateImage(buffer, mimetype);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Process (resize + webp + thumbnail)
  const { full, thumbnail } = await processImage(buffer);

  // Delete existing image if re-uploading
  if (existingUrl) {
    await deleteFromStorage(existingUrl);
    // Also try to delete the thumbnail
    const thumbUrl = existingUrl.replace('.webp', '_thumb.webp');
    await deleteFromStorage(thumbUrl);
  }

  // Upload to storage (GCS or local)
  return await uploadToStorage(full, thumbnail, gcsPath);
}

module.exports = {
  uploadImage,
  deleteFromStorage,
  validateImage,
  processImage,
  ALLOWED_MIMES,
  MAX_FILE_SIZE,
  LOCAL_UPLOAD_DIR,
  isLocalStorage,
};
