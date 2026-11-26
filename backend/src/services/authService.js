const SellerProfile = require('../models/SellerProfile');
const SellerVerification = require('../models/SellerVerification');

function serializeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles: user.roles,
    activeMode: user.activeMode,
    accountStatus: user.accountStatus,
    isContactVerified: Boolean(user.isContactVerified),
    verifiedVia: user.verifiedVia || null,
    createdAt: user.createdAt,
  };
}

/**
 * Loads safe seller summary for an authenticated user (never exposes CNIC or private doc paths).
 */
async function getSafeSellerSummary(userId) {
  const [profile, verification] = await Promise.all([
    SellerProfile.findOne({ userId }).lean(),
    SellerVerification.findOne({ userId })
      .select('status rejectionReason submittedAt reviewedAt applicationHistory')
      .lean(),
  ]);

  const verificationStatus = profile
    ? profile.verificationStatus
    : verification
      ? verification.status
      : 'NOT_SUBMITTED';

  return {
    verificationStatus,
    isVerifiedSeller: verificationStatus === 'APPROVED',
    rejectionReason: verification?.rejectionReason || '',
    submittedAt: verification?.submittedAt || null,
    reviewedAt: verification?.reviewedAt || null,
    profile: profile
      ? {
          legalName: profile.legalName,
          businessName: profile.businessName,
          businessDescription: profile.businessDescription,
          categories: profile.categories,
          phone: profile.contactInformation?.phone || '',
          email: profile.contactInformation?.email || '',
          city: profile.address?.city || '',
          residentialAddress: profile.address?.residentialAddress || '',
          socialLink: profile.portfolio?.socialLink || '',
          portfolioCount: profile.portfolio?.images?.length || 0,
          verificationStatus: profile.verificationStatus,
          verifiedAt: profile.verifiedAt || null,
        }
      : null,
  };
}

/**
 * Determines post-login guidance based on requested mode vs database roles & verification status.
 * Never grants permissions based on requestedMode.
 */
function resolveModeGuidance(user, requestedMode, sellerSummary) {
  const mode = requestedMode === 'seller' ? 'seller' : 'buyer';

  if (mode === 'buyer') {
    return {
      requestedMode: 'buyer',
      grantedMode: user.roles.includes('buyer') ? 'buyer' : user.activeMode,
      redirectTo: user.isContactVerified ? '/buyer/dashboard' : '/verify-account',
      canAccessSellerDashboard: false,
      statusMessage: user.isContactVerified
        ? 'Signed in to Buyer mode.'
        : 'Please verify your email or phone to complete buyer verification.',
    };
  }

  if (!user.roles.includes('seller')) {
    return {
      requestedMode: 'seller',
      grantedMode: 'buyer',
      redirectTo: '/seller/activate',
      canAccessSellerDashboard: false,
      needsSellerActivation: true,
      statusMessage:
        'Your account is currently registered as a Buyer only. Activate Seller mode and submit verification from the same account—no duplicate account needed.',
    };
  }

  const status = sellerSummary.verificationStatus;
  if (status === 'NOT_SUBMITTED') {
    return {
      requestedMode: 'seller',
      grantedMode: 'seller',
      redirectTo: '/seller/verification/intro',
      canAccessSellerDashboard: false,
      statusMessage: 'Complete your seller verification application to start selling.',
    };
  }

  if (status === 'PENDING') {
    return {
      requestedMode: 'seller',
      grantedMode: 'seller',
      redirectTo: '/seller/verification/pending',
      canAccessSellerDashboard: false,
      statusMessage:
        'Your seller verification application is currently pending admin review.',
    };
  }

  if (status === 'REJECTED') {
    return {
      requestedMode: 'seller',
      grantedMode: 'seller',
      redirectTo: '/seller/verification/status',
      canAccessSellerDashboard: false,
      rejectionReason: sellerSummary.rejectionReason,
      statusMessage:
        'Your seller verification was rejected. Review the reason and resubmit your application.',
    };
  }

  return {
    requestedMode: 'seller',
    grantedMode: 'seller',
    redirectTo: '/seller/dashboard',
    canAccessSellerDashboard: true,
    statusMessage: 'Welcome back! Your verified seller account is active.',
  };
}

module.exports = {
  serializeUser,
  getSafeSellerSummary,
  resolveModeGuidance,
};
