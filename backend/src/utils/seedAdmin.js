const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');
const { connectDB } = require('../config/db');

const PLACEHOLDER_PASSWORDS = new Set([
  '',
  'your_secure_admin_password',
  'admin123',
  'password',
]);

/**
 * Seeds the initial admin account using ADMIN_EMAIL and ADMIN_PASSWORD env vars.
 * Never creates an admin if credentials are missing or still placeholders.
 */
async function seedInitialAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const adminName = (process.env.ADMIN_NAME || 'HerSkill Admin').trim();

  if (!adminEmail || PLACEHOLDER_PASSWORDS.has(adminPassword) || adminPassword.length < 8) {
    console.info(
      '[AdminSeed] Skipped admin seeding: set valid ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars, non-placeholder) in backend/.env.'
    );
    return { seeded: false, reason: 'not_configured' };
  }

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) {
    if (!existingAdmin.roles.includes('admin')) {
      existingAdmin.roles.push('admin');
      await existingAdmin.save();
    }
    return { seeded: false, reason: 'already_exists' };
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await User.create({
    name: adminName,
    email: adminEmail,
    phone: process.env.ADMIN_PHONE || '+920000000000',
    passwordHash,
    roles: ['admin'],
    activeMode: 'admin',
    accountStatus: 'ACTIVE',
    isContactVerified: true,
  });

  console.log(`[AdminSeed] Initial admin account ready for ${adminEmail}.`);
  return { seeded: true };
}

if (require.main === module) {
  dotenv.config();
  (async () => {
    const connected = await connectDB();
    if (!connected) {
      process.exitCode = 1;
      return;
    }
    try {
      const result = await seedInitialAdmin();
      console.log('[AdminSeed] Result:', result);
    } finally {
      await mongoose.disconnect();
    }
  })();
}

module.exports = { seedInitialAdmin };
