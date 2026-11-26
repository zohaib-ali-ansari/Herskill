const mongoose = require('mongoose');

const PLACEHOLDER_URIS = new Set([
  '',
  'your_mongodb_connection_string',
  'your_mongodb_atlas_connection_string',
]);

/**
 * Checks whether a non-placeholder MongoDB URI is configured.
 */
function isDatabaseConfigured() {
  const uri = (process.env.MONGODB_URI || '').trim();
  if (PLACEHOLDER_URIS.has(uri)) {
    return false;
  }
  return uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
}

/**
 * Connects to MongoDB Atlas using MONGODB_URI.
 * Returns true when connected, false when configuration is missing or connection fails.
 */
async function connectDB() {
  if (!isDatabaseConfigured()) {
    console.warn(
      '[Database] MONGODB_URI is not configured in backend/.env. ' +
        'Set a valid MongoDB Atlas connection string to enable database operations.'
    );
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Database] Connected to MongoDB.');
    return true;
  } catch (error) {
    console.error('[Database] MongoDB connection failed:', error.message);
    return false;
  }
}

module.exports = {
  connectDB,
  isDatabaseConfigured,
};
