const fs = require('fs');
const path = require('path');

const BACKEND_ROOT = path.resolve(__dirname, '../..');

function getPrivateStorageRoot() {
  const configured = process.env.PRIVATE_DOCUMENT_STORAGE_PATH || './private_uploads';
  return path.isAbsolute(configured)
    ? configured
    : path.resolve(BACKEND_ROOT, configured);
}

function getIdentityUploadDir() {
  return path.join(getPrivateStorageRoot(), 'identity');
}

function getPortfolioUploadDir() {
  return path.join(getPrivateStorageRoot(), 'portfolio');
}

function ensurePrivateStorageDirs() {
  const dirs = [getPrivateStorageRoot(), getIdentityUploadDir(), getPortfolioUploadDir()];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

function getMaxDocumentSizeBytes() {
  const mb = Number(process.env.MAX_DOCUMENT_SIZE_MB) || 5;
  return mb * 1024 * 1024;
}

const ALLOWED_IDENTITY_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
]);

const ALLOWED_IDENTITY_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.pdf']);

const ALLOWED_PORTFOLIO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ALLOWED_PORTFOLIO_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/**
 * Resolves a stored filename safely inside the intended directory, preventing path traversal.
 */
function resolveSafeStoragePath(baseDir, storageKey) {
  if (!storageKey || typeof storageKey !== 'string') {
    return null;
  }
  const safeBase = path.basename(storageKey);
  if (safeBase !== storageKey) {
    return null;
  }
  const resolvedBase = path.resolve(baseDir);
  const targetPath = path.resolve(resolvedBase, safeBase);
  if (!targetPath.startsWith(resolvedBase + path.sep)) {
    return null;
  }
  return targetPath;
}

module.exports = {
  getPrivateStorageRoot,
  getIdentityUploadDir,
  getPortfolioUploadDir,
  ensurePrivateStorageDirs,
  getMaxDocumentSizeBytes,
  ALLOWED_IDENTITY_MIME_TYPES,
  ALLOWED_IDENTITY_EXTENSIONS,
  ALLOWED_PORTFOLIO_MIME_TYPES,
  ALLOWED_PORTFOLIO_EXTENSIONS,
  resolveSafeStoragePath,
};
