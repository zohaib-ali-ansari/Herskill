const mongoose = require('mongoose');
const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const { verifyAuthToken } = require('../utils/crypto');

/**
 * Ensures MongoDB is connected before executing DB-backed route handlers.
 */
function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message:
        'Database is not configured or unavailable. Configure MONGODB_URI in backend/.env.',
    });
  }
  return next();
}

/**
 * Verifies the Bearer JWT and loads the current user directly from MongoDB.
 */
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing.',
      });
    }

    const decoded = verifyAuthToken(token);
    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Your session is no longer valid. Please log in again.',
      });
    }

    if (user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently suspended.',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
}

/**
 * Restricts route access to users who possess at least one of the allowed roles in DB.
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.',
      });
    }

    return next();
  };
}

/**
 * Enforces on the backend that only sellers with APPROVED verification status
 * can publish products or services.
 */
async function requireVerifiedSeller(req, res, next) {
  try {
    if (!req.user || !req.user.roles.includes('seller')) {
      return res.status(403).json({
        success: false,
        message: 'Seller role is required to perform this action.',
      });
    }

    const profile = await SellerProfile.findOne({ userId: req.user._id }).lean();
    if (!profile || profile.verificationStatus !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        code: 'SELLER_NOT_VERIFIED',
        verificationStatus: profile ? profile.verificationStatus : 'NOT_SUBMITTED',
        message:
          'Only verified sellers with APPROVED status can publish products or services.',
      });
    }

    req.sellerProfile = profile;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requireDatabase,
  protect,
  authorizeRoles,
  requireVerifiedSeller,
};
