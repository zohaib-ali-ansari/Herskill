const fs = require('fs');
const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const SellerVerification = require('../models/SellerVerification');
const { decryptSensitiveText } = require('../utils/crypto');
const {
  getIdentityUploadDir,
  getPortfolioUploadDir,
  resolveSafeStoragePath,
} = require('../config/storage');

/**
 * GET /api/admin/dashboard
 * Returns marketplace user and seller verification metrics for the admin dashboard.
 */
async function getDashboardStats(req, res, next) {
  try {
    const [
      totalUsers,
      totalBuyers,
      totalSellers,
      pendingVerifications,
      approvedSellers,
      rejectedApplications,
      recentApplications,
    ] = await Promise.all([
      User.countDocuments({ roles: { $ne: 'admin' } }),
      User.countDocuments({ roles: 'buyer' }),
      User.countDocuments({ roles: 'seller' }),
      SellerVerification.countDocuments({ status: 'PENDING' }),
      SellerVerification.countDocuments({ status: 'APPROVED' }),
      SellerVerification.countDocuments({ status: 'REJECTED' }),
      SellerVerification.find()
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('userId', 'name email phone')
        .select('status submittedAt reviewedAt submittedInformation.business.businessName submittedInformation.personal.legalName')
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalBuyers,
        totalSellers,
        pendingVerifications,
        approvedSellers,
        rejectedApplications,
      },
      recentApplications: recentApplications.map((app) => ({
        id: String(app._id),
        sellerName: app.userId?.name || app.submittedInformation?.personal?.legalName || 'Unknown',
        email: app.userId?.email || '',
        businessName: app.submittedInformation?.business?.businessName || '',
        status: app.status,
        submittedAt: app.submittedAt,
        reviewedAt: app.reviewedAt || null,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/verifications
 * Lists seller verification applications with optional status filter.
 */
async function listVerifications(req, res, next) {
  try {
    const { status = 'ALL', search = '' } = req.query;
    const filter = {};
    if (status && status !== 'ALL' && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      filter.status = status;
    }

    const applications = await SellerVerification.find(filter)
      .sort({ submittedAt: -1 })
      .populate('userId', 'name email phone accountStatus')
      .populate('reviewedBy', 'name email')
      .lean();

    const searchTerm = String(search || '').trim().toLowerCase();
    const filtered = searchTerm
      ? applications.filter((item) => {
          const legalName = item.submittedInformation?.personal?.legalName || '';
          const businessName = item.submittedInformation?.business?.businessName || '';
          const email = item.userId?.email || '';
          const city = item.submittedInformation?.business?.city || '';
          return (
            legalName.toLowerCase().includes(searchTerm) ||
            businessName.toLowerCase().includes(searchTerm) ||
            email.toLowerCase().includes(searchTerm) ||
            city.toLowerCase().includes(searchTerm)
          );
        })
      : applications;

    return res.status(200).json({
      success: true,
      count: filtered.length,
      verifications: filtered.map((app) => ({
        id: String(app._id),
        userId: app.userId ? String(app.userId._id) : null,
        accountName: app.userId?.name || '',
        accountEmail: app.userId?.email || '',
        accountPhone: app.userId?.phone || '',
        legalName: app.submittedInformation?.personal?.legalName || '',
        businessName: app.submittedInformation?.business?.businessName || '',
        categories: app.submittedInformation?.business?.categories || [],
        city: app.submittedInformation?.business?.city || '',
        cnicMasked: app.submittedInformation?.identity?.cnicMasked || '',
        status: app.status,
        rejectionReason: app.rejectionReason || '',
        submittedAt: app.submittedAt,
        reviewedAt: app.reviewedAt || null,
        reviewedBy: app.reviewedBy
          ? { name: app.reviewedBy.name, email: app.reviewedBy.email }
          : null,
        submissionCount: app.applicationHistory?.length || 1,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/verifications/:id
 * Returns full details of a seller verification application for admin review.
 */
async function getVerificationDetail(req, res, next) {
  try {
    const verification = await SellerVerification.findById(req.params.id)
      .select('+submittedInformation.identity.cnicEncrypted')
      .populate('userId', 'name email phone roles accountStatus isContactVerified createdAt')
      .populate('reviewedBy', 'name email')
      .populate('applicationHistory.reviewedBy', 'name email')
      .lean();

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification application not found.',
      });
    }

    const sellerProfile = verification.userId
      ? await SellerProfile.findOne({ userId: verification.userId._id }).lean()
      : null;

    const decryptedCnic = decryptSensitiveText(
      verification.submittedInformation?.identity?.cnicEncrypted
    );

    const id = String(verification._id);
    const docs = verification.secureDocumentReferences || {};

    return res.status(200).json({
      success: true,
      verification: {
        id,
        status: verification.status,
        rejectionReason: verification.rejectionReason || '',
        submittedAt: verification.submittedAt,
        reviewedAt: verification.reviewedAt || null,
        reviewedBy: verification.reviewedBy
          ? {
              id: String(verification.reviewedBy._id),
              name: verification.reviewedBy.name,
              email: verification.reviewedBy.email,
            }
          : null,
        applicant: verification.userId
          ? {
              id: String(verification.userId._id),
              name: verification.userId.name,
              email: verification.userId.email,
              phone: verification.userId.phone,
              roles: verification.userId.roles,
              accountStatus: verification.userId.accountStatus,
              isContactVerified: verification.userId.isContactVerified,
              createdAt: verification.userId.createdAt,
            }
          : null,
        personal: verification.submittedInformation?.personal || null,
        identity: {
          cnicMasked: verification.submittedInformation?.identity?.cnicMasked || '',
          cnicNumber: decryptedCnic || '',
        },
        business: verification.submittedInformation?.business || null,
        declarationAccepted: Boolean(
          verification.submittedInformation?.declarationAccepted
        ),
        documents: {
          cnicFront: docs.cnicFront
            ? {
                originalName: docs.cnicFront.originalName,
                mimeType: docs.cnicFront.mimeType,
                size: docs.cnicFront.size,
                endpoint: `/api/admin/verifications/${id}/documents/cnicFront`,
              }
            : null,
          cnicBack: docs.cnicBack
            ? {
                originalName: docs.cnicBack.originalName,
                mimeType: docs.cnicBack.mimeType,
                size: docs.cnicBack.size,
                endpoint: `/api/admin/verifications/${id}/documents/cnicBack`,
              }
            : null,
          additionalDocument: docs.additionalDocument
            ? {
                originalName: docs.additionalDocument.originalName,
                mimeType: docs.additionalDocument.mimeType,
                size: docs.additionalDocument.size,
                endpoint: `/api/admin/verifications/${id}/documents/additionalDocument`,
              }
            : null,
        },
        portfolioImages: (sellerProfile?.portfolio?.images || []).map((img) => ({
          storageKey: img.storageKey,
          originalName: img.originalName,
          mimeType: img.mimeType,
          size: img.size,
          endpoint: `/api/admin/verifications/${id}/portfolio/${img.storageKey}`,
        })),
        applicationHistory: (verification.applicationHistory || []).map((entry) => ({
          submissionNumber: entry.submissionNumber,
          status: entry.status,
          submittedAt: entry.submittedAt,
          reviewedAt: entry.reviewedAt || null,
          reviewedBy: entry.reviewedBy
            ? { name: entry.reviewedBy.name, email: entry.reviewedBy.email }
            : null,
          rejectionReason: entry.rejectionReason || '',
          snapshot: entry.snapshot,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/verifications/:id/documents/:docType
 * Securely streams a private identity document only to an authenticated admin.
 */
async function streamVerificationDocument(req, res, next) {
  try {
    const { id, docType } = req.params;
    if (!['cnicFront', 'cnicBack', 'additionalDocument'].includes(docType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type requested.',
      });
    }

    const verification = await SellerVerification.findById(id)
      .select('secureDocumentReferences')
      .lean();

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification application not found.',
      });
    }

    const docRef = verification.secureDocumentReferences?.[docType];
    if (!docRef || !docRef.storageKey) {
      return res.status(404).json({
        success: false,
        message: 'Requested document does not exist.',
      });
    }

    const filePath = resolveSafeStoragePath(getIdentityUploadDir(), docRef.storageKey);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document file is missing from private storage.',
      });
    }

    res.setHeader('Content-Type', docRef.mimeType);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${docRef.originalName.replace(/["\\]/g, '_')}"`
    );
    return res.sendFile(filePath);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/verifications/:id/portfolio/:storageKey
 */
async function streamVerificationPortfolioImage(req, res, next) {
  try {
    const { id, storageKey } = req.params;
    const verification = await SellerVerification.findById(id).select('userId').lean();
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification application not found.',
      });
    }

    const profile = await SellerProfile.findOne({ userId: verification.userId }).lean();
    const img = profile?.portfolio?.images?.find((item) => item.storageKey === storageKey);
    if (!img) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio image not found.',
      });
    }

    const filePath = resolveSafeStoragePath(getPortfolioUploadDir(), img.storageKey);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio image file not found.',
      });
    }

    res.setHeader('Content-Type', img.mimeType);
    res.setHeader('Cache-Control', 'no-store, private');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(filePath);
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/verifications/:id/approve
 */
async function approveVerification(req, res, next) {
  try {
    const verification = await SellerVerification.findById(req.params.id);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification application not found.',
      });
    }

    if (verification.status === 'APPROVED') {
      return res.status(409).json({
        success: false,
        message: 'This application has already been approved.',
      });
    }

    if (verification.status !== 'PENDING') {
      return res.status(409).json({
        success: false,
        message: 'Only pending applications can be approved.',
      });
    }

    const now = new Date();
    verification.status = 'APPROVED';
    verification.rejectionReason = '';
    verification.reviewedBy = req.user._id;
    verification.reviewedAt = now;

    if (verification.applicationHistory.length > 0) {
      const latest =
        verification.applicationHistory[verification.applicationHistory.length - 1];
      latest.status = 'APPROVED';
      latest.reviewedBy = req.user._id;
      latest.reviewedAt = now;
      latest.rejectionReason = '';
    }

    await verification.save();

    await Promise.all([
      SellerProfile.findOneAndUpdate(
        { userId: verification.userId },
        {
          verificationStatus: 'APPROVED',
          verifiedAt: now,
        }
      ),
      User.findByIdAndUpdate(verification.userId, {
        $addToSet: { roles: 'seller' },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Seller verification approved successfully.',
      status: verification.status,
      reviewedAt: now,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/verifications/:id/reject
 */
async function rejectVerification(req, res, next) {
  try {
    const reason = String(req.body.rejectionReason || '').trim();
    const verification = await SellerVerification.findById(req.params.id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification application not found.',
      });
    }

    if (verification.status === 'REJECTED') {
      return res.status(409).json({
        success: false,
        message: 'This application has already been rejected.',
      });
    }

    if (verification.status !== 'PENDING') {
      return res.status(409).json({
        success: false,
        message: 'Only pending applications can be rejected.',
      });
    }

    const now = new Date();
    verification.status = 'REJECTED';
    verification.rejectionReason = reason;
    verification.reviewedBy = req.user._id;
    verification.reviewedAt = now;

    if (verification.applicationHistory.length > 0) {
      const latest =
        verification.applicationHistory[verification.applicationHistory.length - 1];
      latest.status = 'REJECTED';
      latest.reviewedBy = req.user._id;
      latest.reviewedAt = now;
      latest.rejectionReason = reason;
    }

    await verification.save();

    await SellerProfile.findOneAndUpdate(
      { userId: verification.userId },
      {
        verificationStatus: 'REJECTED',
        $unset: { verifiedAt: 1 },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Seller verification rejected and decision recorded.',
      status: verification.status,
      rejectionReason: reason,
      reviewedAt: now,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getDashboardStats,
  listVerifications,
  getVerificationDetail,
  streamVerificationDocument,
  streamVerificationPortfolioImage,
  approveVerification,
  rejectVerification,
};
