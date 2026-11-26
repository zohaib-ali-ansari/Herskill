const bcrypt = require('bcryptjs');
const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const {
  signAuthToken,
  hashToken,
  generateNumericCode,
  generateSecureToken,
} = require('../utils/crypto');
const {
  serializeUser,
  getSafeSellerSummary,
  resolveModeGuidance,
} = require('../services/authService');

function isEmailServiceConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
}

/**
 * POST /api/auth/register
 * Registers a Buyer or Seller account (admin role cannot be created publicly).
 */
async function register(req, res, next) {
  try {
    const { name, email, phone, password, accountType } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone).trim();

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          'An account with this email or phone number already exists. Please log in instead—you can use both Buyer and Seller features from one account.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationCode = generateNumericCode(6);
    const contactVerificationTokenHash = hashToken(verificationCode);
    const contactVerificationExpires = new Date(Date.now() + 30 * 60 * 1000);

    const isSeller = accountType === 'seller';
    const roles = isSeller ? ['buyer', 'seller'] : ['buyer'];
    const activeMode = isSeller ? 'seller' : 'buyer';

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      roles,
      activeMode,
      accountStatus: 'PENDING_VERIFICATION',
      isContactVerified: false,
      contactVerificationTokenHash,
      contactVerificationExpires,
    });

    if (isSeller) {
      await SellerProfile.create({
        userId: user._id,
        contactInformation: {
          email: user.email,
          phone: user.phone,
        },
        verificationStatus: 'NOT_SUBMITTED',
      });
    }

    const token = signAuthToken(user._id, false);
    const sellerSummary = await getSafeSellerSummary(user._id);
    const emailConfigured = isEmailServiceConfigured();

    const responsePayload = {
      success: true,
      message: isSeller
        ? 'Seller account created. Please complete your seller verification application.'
        : 'Account created. Please verify your email or phone to activate full buyer access.',
      token,
      user: serializeUser(user),
      seller: sellerSummary,
      verificationDelivery: {
        configured: emailConfigured,
        note: emailConfigured
          ? 'Verification code sent to your registered contact.'
          : 'External email/SMS delivery is not configured in this environment.',
      },
    };

    if (!emailConfigured && process.env.NODE_ENV !== 'production') {
      responsePayload.verificationDelivery.devVerificationCode = verificationCode;
    }

    return res.status(201).json(responsePayload);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/auth/login
 * Authenticates via email or phone and resolves buyer/seller mode strictly from DB.
 */
async function login(req, res, next) {
  try {
    const identifier = String(req.body.identifier || req.body.email || '').trim();
    const { password, rememberMe = false, requestedMode = 'buyer' } = req.body;

    const normalizedIdentifier = identifier.includes('@')
      ? identifier.toLowerCase()
      : identifier;

    const user = await User.findOne({
      $or: [{ email: normalizedIdentifier }, { phone: identifier }],
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/phone or password.',
      });
    }

    if (user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/phone or password.',
      });
    }

    if (user.roles.includes('admin') && !user.roles.includes('buyer') && !user.roles.includes('seller')) {
      return res.status(403).json({
        success: false,
        message: 'Administrator accounts must sign in through the Admin Portal.',
      });
    }

    const safeMode =
      requestedMode === 'seller' && user.roles.includes('seller')
        ? 'seller'
        : user.roles.includes('buyer')
          ? 'buyer'
          : user.activeMode;

    if (user.activeMode !== safeMode && safeMode !== 'admin') {
      user.activeMode = safeMode;
      await user.save();
    }

    const token = signAuthToken(user._id, Boolean(rememberMe));
    const sellerSummary = await getSafeSellerSummary(user._id);
    const modeGuidance = resolveModeGuidance(user, requestedMode, sellerSummary);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: serializeUser(user),
      seller: sellerSummary,
      modeGuidance,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/auth/admin/login
 * Dedicated protected login for administrator accounts only.
 */
async function adminLogin(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password, rememberMe = false } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.roles.includes('admin')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.',
      });
    }

    if (user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'This administrator account is suspended.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.',
      });
    }

    const token = signAuthToken(user._id, Boolean(rememberMe));
    return res.status(200).json({
      success: true,
      message: 'Administrator login successful.',
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
  try {
    const sellerSummary = await getSafeSellerSummary(req.user._id);
    return res.status(200).json({
      success: true,
      user: serializeUser(req.user),
      seller: sellerSummary,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/auth/verify-contact
 * Verifies a user's email or phone using the issued verification code.
 */
async function verifyContact(req, res, next) {
  try {
    const { code, method = 'email' } = req.body;
    const user = await User.findById(req.user._id).select(
      '+contactVerificationTokenHash +contactVerificationExpires'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (user.isContactVerified) {
      return res.status(200).json({
        success: true,
        message: 'Your contact information is already verified.',
        user: serializeUser(user),
      });
    }

    if (
      !user.contactVerificationTokenHash ||
      !user.contactVerificationExpires ||
      user.contactVerificationExpires < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    const incomingHash = hashToken(String(code).trim());
    if (incomingHash !== user.contactVerificationTokenHash) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code.',
      });
    }

    user.isContactVerified = true;
    user.verifiedVia = method === 'phone' ? 'phone' : 'email';
    user.accountStatus = 'ACTIVE';
    user.contactVerificationTokenHash = undefined;
    user.contactVerificationExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully.',
      user: serializeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/auth/resend-verification
 */
async function resendVerification(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (user.isContactVerified) {
      return res.status(200).json({
        success: true,
        message: 'Account is already verified.',
      });
    }

    const verificationCode = generateNumericCode(6);
    user.contactVerificationTokenHash = hashToken(verificationCode);
    user.contactVerificationExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const emailConfigured = isEmailServiceConfigured();
    const payload = {
      success: true,
      message: emailConfigured
        ? 'A new verification code has been sent.'
        : 'New verification code generated (external email/SMS delivery is not configured).',
      verificationDelivery: {
        configured: emailConfigured,
      },
    };

    if (!emailConfigured && process.env.NODE_ENV !== 'production') {
      payload.verificationDelivery.devVerificationCode = verificationCode;
    }

    return res.status(200).json(payload);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email });
    const emailConfigured = isEmailServiceConfigured();

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          'If an account exists with that email, password reset instructions have been prepared.',
        deliveryConfigured: emailConfigured,
      });
    }

    const resetToken = generateSecureToken(24);
    user.resetPasswordTokenHash = hashToken(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const payload = {
      success: true,
      message: emailConfigured
        ? 'Password reset instructions have been sent to your email.'
        : 'Reset token generated. External email delivery is not configured in this environment.',
      deliveryConfigured: emailConfigured,
    };

    if (!emailConfigured && process.env.NODE_ENV !== 'production') {
      payload.devResetToken = resetToken;
    }

    return res.status(200).json(payload);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const tokenHash = hashToken(String(token).trim());

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordTokenHash +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
      });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in.',
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/auth/switch-mode
 * Switches activeMode between buyer and seller only if the user already holds that role in DB.
 */
async function switchMode(req, res, next) {
  try {
    const { mode } = req.body;
    if (!['buyer', 'seller'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Mode must be either buyer or seller.',
      });
    }

    if (!req.user.roles.includes(mode)) {
      return res.status(403).json({
        success: false,
        code: 'ROLE_NOT_ACTIVE',
        message:
          mode === 'seller'
            ? 'Seller mode is not activated on your account yet.'
            : 'Buyer mode is not available on this account.',
      });
    }

    req.user.activeMode = mode;
    await req.user.save();

    const sellerSummary = await getSafeSellerSummary(req.user._id);
    const modeGuidance = resolveModeGuidance(req.user, mode, sellerSummary);

    return res.status(200).json({
      success: true,
      user: serializeUser(req.user),
      seller: sellerSummary,
      modeGuidance,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/auth/profile
 * Updates basic account profile information (name, phone) for the authenticated user.
 */
async function updateProfile(req, res, next) {
  try {
    const name = req.body.name !== undefined ? String(req.body.name).trim() : req.user.name;
    const phone = req.body.phone !== undefined ? String(req.body.phone).trim() : req.user.phone;

    if (phone !== req.user.phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone && String(existingPhone._id) !== String(req.user._id)) {
        return res.status(409).json({
          success: false,
          message: 'This phone number is already associated with another account.',
        });
      }
    }

    req.user.name = name;
    req.user.phone = phone;
    await req.user.save();

    if (req.user.roles.includes('seller')) {
      const profile = await SellerProfile.findOne({ userId: req.user._id });
      if (profile) {
        profile.contactInformation = {
          ...(profile.contactInformation || {}),
          phone,
          email: req.user.email,
        };
        await profile.save();
      }
    }

    const sellerSummary = await getSafeSellerSummary(req.user._id);
    return res.status(200).json({
      success: true,
      message: 'Account profile updated successfully.',
      user: serializeUser(req.user),
      seller: sellerSummary,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/auth/change-password
 * Updates password after verifying current password.
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  adminLogin,
  logout,
  getMe,
  verifyContact,
  resendVerification,
  forgotPassword,
  resetPassword,
  switchMode,
  updateProfile,
  changePassword,
};
