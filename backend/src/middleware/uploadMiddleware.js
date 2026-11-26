const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const {
  getIdentityUploadDir,
  getPortfolioUploadDir,
  ensurePrivateStorageDirs,
  getMaxDocumentSizeBytes,
  ALLOWED_IDENTITY_MIME_TYPES,
  ALLOWED_IDENTITY_EXTENSIONS,
  ALLOWED_PORTFOLIO_MIME_TYPES,
  ALLOWED_PORTFOLIO_EXTENSIONS,
} = require('../config/storage');

const IDENTITY_FIELDS = new Set(['cnicFront', 'cnicBack', 'additionalDocument']);
const PORTFOLIO_FIELDS = new Set(['portfolioImages']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensurePrivateStorageDirs();
    if (IDENTITY_FIELDS.has(file.fieldname)) {
      return cb(null, getIdentityUploadDir());
    }
    if (PORTFOLIO_FIELDS.has(file.fieldname)) {
      return cb(null, getPortfolioUploadDir());
    }
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const storageKey = `${crypto.randomUUID()}${ext}`;
    cb(null, storageKey);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (IDENTITY_FIELDS.has(file.fieldname)) {
    const validMime = ALLOWED_IDENTITY_MIME_TYPES.has(file.mimetype);
    const validExt = ALLOWED_IDENTITY_EXTENSIONS.has(ext);
    if (!validMime || !validExt) {
      const err = new Error(
        'Identity documents must be JPG, PNG, or PDF files.'
      );
      err.statusCode = 400;
      return cb(err);
    }
    return cb(null, true);
  }

  if (PORTFOLIO_FIELDS.has(file.fieldname)) {
    const validMime = ALLOWED_PORTFOLIO_MIME_TYPES.has(file.mimetype);
    const validExt = ALLOWED_PORTFOLIO_EXTENSIONS.has(ext);
    if (!validMime || !validExt) {
      const err = new Error(
        'Portfolio sample images must be JPG, PNG, or WEBP files.'
      );
      err.statusCode = 400;
      return cb(err);
    }
    return cb(null, true);
  }

  return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
}

const verificationUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: getMaxDocumentSizeBytes(),
    files: 8,
  },
}).fields([
  { name: 'cnicFront', maxCount: 1 },
  { name: 'cnicBack', maxCount: 1 },
  { name: 'additionalDocument', maxCount: 1 },
  { name: 'portfolioImages', maxCount: 5 },
]);

/**
 * Deletes uploaded temporary files from disk when validation or submission fails.
 */
function cleanupUploadedFiles(req) {
  if (!req.files || typeof req.files !== 'object') {
    return;
  }
  for (const fieldFiles of Object.values(req.files)) {
    if (!Array.isArray(fieldFiles)) continue;
    for (const file of fieldFiles) {
      if (file && file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }
}

module.exports = {
  verificationUpload,
  cleanupUploadedFiles,
};
