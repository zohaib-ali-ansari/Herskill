const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const PLACEHOLDER_SECRETS = new Set([
  '',
  'your_jwt_secret',
  'your_jwt_secret_change_in_production',
  'your_super_secret_jwt_key_change_this',
]);

function isJwtConfigured() {
  const secret = (process.env.JWT_SECRET || '').trim();
  return Boolean(secret) && !PLACEHOLDER_SECRETS.has(secret);
}

function getJwtSecret() {
  const secret = (process.env.JWT_SECRET || '').trim();
  if (!secret || PLACEHOLDER_SECRETS.has(secret)) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set to a strong secret in production.');
    }
    if (!secret) {
      throw new Error('JWT_SECRET is missing from environment variables.');
    }
  }
  return secret;
}

function signAuthToken(userId, rememberMe = false) {
  const secret = getJwtSecret();
  const expiresIn = rememberMe ? '7d' : '1d';
  return jwt.sign({ sub: String(userId) }, secret, { expiresIn });
}

function verifyAuthToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

function generateNumericCode(length = 6) {
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return String(num).padStart(length, '0');
}

function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function getEncryptionKey() {
  const secret = getJwtSecret();
  return crypto.createHash('sha256').update(`herskill-cnic:${secret}`).digest();
}

function encryptSensitiveText(plainText) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plainText), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptSensitiveText(payload) {
  if (!payload || typeof payload !== 'string') {
    return null;
  }
  const parts = payload.split(':');
  if (parts.length !== 3) {
    return null;
  }
  const [ivHex, tagHex, dataHex] = parts;
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/**
 * Masks CNIC digits, leaving only the final digit visible (e.g. *****-*******-1).
 */
function maskCnic(cnic) {
  const digits = String(cnic || '').replace(/\D/g, '');
  if (digits.length < 4) {
    return '****';
  }
  const last1 = digits.slice(-1);
  return `*****-*******-${last1}`;
}

module.exports = {
  isJwtConfigured,
  getJwtSecret,
  signAuthToken,
  verifyAuthToken,
  hashToken,
  generateNumericCode,
  generateSecureToken,
  encryptSensitiveText,
  decryptSensitiveText,
  maskCnic,
};
