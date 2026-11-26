
const dns = require('node:dns');

// Use Google DNS for MongoDB SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { connectDB } = require('./config/db');
const { ensurePrivateStorageDirs } = require('./config/storage');
const { isJwtConfigured } = require('./utils/crypto');
const { seedInitialAdmin } = require('./utils/seedAdmin');

const PORT = process.env.PORT || 5000;

async function startServer() {
  ensurePrivateStorageDirs();

  if (!isJwtConfigured()) {
    console.warn(
      '[Security] JWT_SECRET is missing or using a placeholder in backend/.env. Set a strong secret before production.'
    );
  }

  const dbConnected = await connectDB();

  if (dbConnected) {
    await seedInitialAdmin();
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
