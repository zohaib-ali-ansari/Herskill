const fs = require('fs');
const SellerProfile = require('../models/SellerProfile');
const SellerVerification = require('../models/SellerVerification');
const { cleanupUploadedFiles } = require('../middleware/uploadMiddleware');
const {
  encryptSensitiveText,
  hashToken,
  maskCnic,
} = require('../utils/crypto');
const { serializeUser, getSafeSellerSummary } = require('../services/authService');
const {
  getPortfolioUploadDir,
  resolveSafeStoragePath,
} = require('../config/storage');

function parseCategories(raw) {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // Fallback to comma splitting
      }
    }
    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function buildDocRef(file) {
  return {
    storageKey: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
}

function formatSafeVerificationResponse(verification, profile) {
  if (!verification) {
    return {
      status: profile ? profile.verificationStatus : 'NOT_SUBMITTED',
      rejectionReason: '',
      submittedAt: null,
      reviewedAt: null,
      submittedInformation: null,
      documentsSummary: null,
      applicationHistory: [],
    };
  }

  return {
    status: verification.status,
    rejectionReason: verification.rejectionReason || '',
    submittedAt: verification.submittedAt || null,
    reviewedAt: verification.reviewedAt || null,
    submittedInformation: {
      personal: verification.submittedInformation?.personal || null,
      identity: {
        cnicMasked: verification.submittedInformation?.identity?.cnicMasked || '',
      },
      business: verification.submittedInformation?.business || null,
      declarationAccepted: Boolean(
        verification.submittedInformation?.declarationAccepted
      ),
    },
    documentsSummary: {
      cnicFrontUploaded: Boolean(verification.secureDocumentReferences?.cnicFront),
      cnicBackUploaded: Boolean(verification.secureDocumentReferences?.cnicBack),
      additionalDocumentUploaded: Boolean(
        verification.secureDocumentReferences?.additionalDocument
      ),
      portfolioCount: profile?.portfolio?.images?.length || 0,
    },
    applicationHistory: (verification.applicationHistory || []).map((entry) => ({
      submissionNumber: entry.submissionNumber,
      status: entry.status,
      submittedAt: entry.submittedAt,
      reviewedAt: entry.reviewedAt || null,
      rejectionReason: entry.rejectionReason || '',
      snapshot: entry.snapshot,
    })),
  };
}

/**
 * POST /api/seller/activate
 * Enables Seller role on an existing Buyer account without creating a duplicate account.
 */
async function activateSellerMode(req, res, next) {
  try {
    const user = req.user;

    if (!user.roles.includes('seller')) {
      user.roles.push('seller');
    }
    user.activeMode = 'seller';
    await user.save();

    let profile = await SellerProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = await SellerProfile.create({
        userId: user._id,
        contactInformation: {
          email: user.email,
          phone: user.phone,
        },
        verificationStatus: 'NOT_SUBMITTED',
      });
    }

    const sellerSummary = await getSafeSellerSummary(user._id);
    return res.status(200).json({
      success: true,
      message: 'Seller mode activated on your account. Complete verification to start selling.',
      user: serializeUser(user),
      seller: sellerSummary,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/seller/profile
 */
async function getSellerProfile(req, res, next) {
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
 * PATCH /api/seller/profile
 * Updates editable seller business profile details without altering verification status.
 */
async function updateSellerProfile(req, res, next) {
  try {
    const {
      businessName,
      businessDescription,
      categories: rawCategories,
      city,
      residentialAddress,
      socialLink,
      phone,
    } = req.body;

    let profile = await SellerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await SellerProfile.create({
        userId: req.user._id,
        contactInformation: {
          email: req.user.email,
          phone: req.user.phone,
        },
        verificationStatus: 'NOT_SUBMITTED',
      });
    }

    if (businessName !== undefined) {
      profile.businessName = String(businessName).trim();
    }
    if (businessDescription !== undefined) {
      profile.businessDescription = String(businessDescription).trim();
    }
    if (rawCategories !== undefined) {
      const categories = parseCategories(rawCategories);
      if (categories.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Select at least one product or service category.',
        });
      }
      profile.categories = categories;
    }
    if (city !== undefined || residentialAddress !== undefined) {
      profile.address = {
        city:
          city !== undefined
            ? String(city).trim()
            : profile.address?.city || '',
        residentialAddress:
          residentialAddress !== undefined
            ? String(residentialAddress).trim()
            : profile.address?.residentialAddress || '',
      };
    }
    if (socialLink !== undefined) {
      profile.portfolio = {
        images: profile.portfolio?.images || [],
        socialLink: String(socialLink || '').trim(),
      };
    }
    if (phone !== undefined) {
      profile.contactInformation = {
        email: profile.contactInformation?.email || req.user.email,
        phone: String(phone).trim(),
      };
    }

    await profile.save();

    const sellerSummary = await getSafeSellerSummary(req.user._id);
    return res.status(200).json({
      success: true,
      message: 'Seller profile updated successfully.',
      user: serializeUser(req.user),
      seller: sellerSummary,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/seller/verification-status
 */
async function getVerificationStatus(req, res, next) {
  try {
    const [profile, verification] = await Promise.all([
      SellerProfile.findOne({ userId: req.user._id }).lean(),
      SellerVerification.findOne({ userId: req.user._id }).lean(),
    ]);

    return res.status(200).json({
      success: true,
      verification: formatSafeVerificationResponse(verification, profile),
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/seller/verification
 * Submits an initial seller verification application.
 */
async function submitVerification(req, res, next) {
  try {
    const existing = await SellerVerification.findOne({ userId: req.user._id });
    if (existing) {
      cleanupUploadedFiles(req);
      if (existing.status === 'PENDING') {
        return res.status(409).json({
          success: false,
          message:
            'You already have a verification application pending review. Duplicate submissions are not allowed.',
        });
      }
      if (existing.status === 'APPROVED') {
        return res.status(409).json({
          success: false,
          message: 'Your seller account is already verified.',
        });
      }
      return res.status(409).json({
        success: false,
        message:
          'Your previous application was rejected. Please use the resubmission option to update and resubmit.',
      });
    }

    const cnicFrontFile = req.files?.cnicFront?.[0];
    const cnicBackFile = req.files?.cnicBack?.[0];
    const additionalFile = req.files?.additionalDocument?.[0];
    const portfolioFiles = req.files?.portfolioImages || [];

    if (!cnicFrontFile || !cnicBackFile) {
      cleanupUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: 'Both CNIC front and CNIC back documents are required.',
      });
    }

    const {
      legalName,
      dateOfBirth,
      phone,
      email,
      city,
      residentialAddress,
      cnicNumber,
      businessName,
      categories: rawCategories,
      businessDescription,
      businessCity,
      socialLink = '',
      declarationAccepted,
    } = req.body;

    if (declarationAccepted !== true && declarationAccepted !== 'true') {
      cleanupUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: 'You must accept the verification accuracy declaration.',
      });
    }

    const categories = parseCategories(rawCategories);
    if (categories.length === 0) {
      cleanupUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: 'Select at least one product or service category.',
      });
    }

    const effectiveBusinessCity = String(businessCity || city).trim();
    const portfolioRefs = portfolioFiles.map(buildDocRef);
    const now = new Date();

    const submittedInformation = {
      personal: {
        legalName: String(legalName).trim(),
        dateOfBirth: new Date(dateOfBirth),
        phone: String(phone).trim(),
        email: String(email).trim().toLowerCase(),
        city: String(city).trim(),
        residentialAddress: String(residentialAddress).trim(),
      },
      identity: {
        cnicEncrypted: encryptSensitiveText(String(cnicNumber).trim()),
        cnicMasked: maskCnic(cnicNumber),
        cnicHash: hashToken(String(cnicNumber).replace(/\D/g, '')),
      },
      business: {
        businessName: String(businessName).trim(),
        categories,
        businessDescription: String(businessDescription).trim(),
        city: effectiveBusinessCity,
        socialLink: String(socialLink || '').trim(),
        portfolioCount: portfolioRefs.length,
      },
      declarationAccepted: true,
    };

    const secureDocumentReferences = {
      cnicFront: buildDocRef(cnicFrontFile),
      cnicBack: buildDocRef(cnicBackFile),
      ...(additionalFile ? { additionalDocument: buildDocRef(additionalFile) } : {}),
    };

    const historyEntry = {
      submissionNumber: 1,
      status: 'PENDING',
      submittedAt: now,
      snapshot: {
        legalName: submittedInformation.personal.legalName,
        businessName: submittedInformation.business.businessName,
        categories,
        city: effectiveBusinessCity,
      },
    };

    const verification = await SellerVerification.create({
      userId: req.user._id,
      submittedInformation,
      secureDocumentReferences,
      status: 'PENDING',
      submittedAt: now,
      applicationHistory: [historyEntry],
    });

    const profile = await SellerProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        legalName: submittedInformation.personal.legalName,
        dateOfBirth: submittedInformation.personal.dateOfBirth,
        contactInformation: {
          phone: submittedInformation.personal.phone,
          email: submittedInformation.personal.email,
        },
        address: {
          city: submittedInformation.personal.city,
          residentialAddress: submittedInformation.personal.residentialAddress,
        },
        businessName: submittedInformation.business.businessName,
        businessDescription: submittedInformation.business.businessDescription,
        categories,
        portfolio: {
          images: portfolioRefs,
          socialLink: submittedInformation.business.socialLink,
        },
        verificationStatus: 'PENDING',
      },
      { new: true, upsert: true }
    );

    if (!req.user.roles.includes('seller')) {
      req.user.roles.push('seller');
      req.user.activeMode = 'seller';
      await req.user.save();
    }

    return res.status(201).json({
      success: true,
      message:
        'Your seller verification application has been submitted and is waiting for admin review.',
      verification: formatSafeVerificationResponse(verification, profile),
    });
  } catch (error) {
    cleanupUploadedFiles(req);
    return next(error);
  }
}

/**
 * PUT /api/seller/verification/resubmit
 * Allows a REJECTED seller to update details/documents and resubmit while preserving history.
 */
async function resubmitVerification(req, res, next) {
  try {
    const verification = await SellerVerification.findOne({
      userId: req.user._id,
    }).select('+submittedInformation.identity.cnicEncrypted +submittedInformation.identity.cnicHash');

    if (!verification) {
      cleanupUploadedFiles(req);
      return res.status(404).json({
        success: false,
        message: 'No existing verification application found. Submit a new application first.',
      });
    }

    if (verification.status !== 'REJECTED') {
      cleanupUploadedFiles(req);
      return res.status(409).json({
        success: false,
        message:
          verification.status === 'PENDING'
            ? 'Your verification application is already pending review.'
            : 'Only rejected verification applications can be resubmitted.',
      });
    }

    const {
      legalName,
      dateOfBirth,
      phone,
      email,
      city,
      residentialAddress,
      cnicNumber,
      businessName,
      categories: rawCategories,
      businessDescription,
      businessCity,
      socialLink = '',
      declarationAccepted,
    } = req.body;

    if (declarationAccepted !== true && declarationAccepted !== 'true') {
      cleanupUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: 'You must accept the verification accuracy declaration.',
      });
    }

    const categories = parseCategories(rawCategories);
    if (categories.length === 0) {
      cleanupUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: 'Select at least one product or service category.',
      });
    }

    const cnicFrontFile = req.files?.cnicFront?.[0];
    const cnicBackFile = req.files?.cnicBack?.[0];
    const additionalFile = req.files?.additionalDocument?.[0];
    const portfolioFiles = req.files?.portfolioImages || [];

    const existingProfile = await SellerProfile.findOne({ userId: req.user._id });
    const portfolioRefs =
      portfolioFiles.length > 0
        ? portfolioFiles.map(buildDocRef)
        : existingProfile?.portfolio?.images || [];

    const effectiveBusinessCity = String(businessCity || city).trim();
    const now = new Date();
    const nextSubmissionNumber = (verification.applicationHistory?.length || 0) + 1;

    const updatedIdentity =
      cnicNumber && String(cnicNumber).trim()
        ? {
            cnicEncrypted: encryptSensitiveText(String(cnicNumber).trim()),
            cnicMasked: maskCnic(cnicNumber),
            cnicHash: hashToken(String(cnicNumber).replace(/\D/g, '')),
          }
        : verification.submittedInformation.identity;

    verification.submittedInformation = {
      personal: {
        legalName: String(legalName).trim(),
        dateOfBirth: new Date(dateOfBirth),
        phone: String(phone).trim(),
        email: String(email).trim().toLowerCase(),
        city: String(city).trim(),
        residentialAddress: String(residentialAddress).trim(),
      },
      identity: updatedIdentity,
      business: {
        businessName: String(businessName).trim(),
        categories,
        businessDescription: String(businessDescription).trim(),
        city: effectiveBusinessCity,
        socialLink: String(socialLink || '').trim(),
        portfolioCount: portfolioRefs.length,
      },
      declarationAccepted: true,
    };

    if (cnicFrontFile) {
      verification.secureDocumentReferences.cnicFront = buildDocRef(cnicFrontFile);
    }
    if (cnicBackFile) {
      verification.secureDocumentReferences.cnicBack = buildDocRef(cnicBackFile);
    }
    if (additionalFile) {
      verification.secureDocumentReferences.additionalDocument =
        buildDocRef(additionalFile);
    }

    verification.status = 'PENDING';
    verification.rejectionReason = '';
    verification.reviewedBy = undefined;
    verification.reviewedAt = undefined;
    verification.submittedAt = now;

    verification.applicationHistory.push({
      submissionNumber: nextSubmissionNumber,
      status: 'PENDING',
      submittedAt: now,
      snapshot: {
        legalName: verification.submittedInformation.personal.legalName,
        businessName: verification.submittedInformation.business.businessName,
        categories,
        city: effectiveBusinessCity,
      },
    });

    await verification.save();

    const profile = await SellerProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        legalName: verification.submittedInformation.personal.legalName,
        dateOfBirth: verification.submittedInformation.personal.dateOfBirth,
        contactInformation: {
          phone: verification.submittedInformation.personal.phone,
          email: verification.submittedInformation.personal.email,
        },
        address: {
          city: verification.submittedInformation.personal.city,
          residentialAddress:
            verification.submittedInformation.personal.residentialAddress,
        },
        businessName: verification.submittedInformation.business.businessName,
        businessDescription:
          verification.submittedInformation.business.businessDescription,
        categories,
        portfolio: {
          images: portfolioRefs,
          socialLink: verification.submittedInformation.business.socialLink,
        },
        verificationStatus: 'PENDING',
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message:
        'Your updated verification application has been resubmitted for admin review.',
      verification: formatSafeVerificationResponse(verification, profile),
    });
  } catch (error) {
    cleanupUploadedFiles(req);
    return next(error);
  }
}

/**
 * POST /api/seller/publish-check
 * Backend enforcement check confirming only APPROVED sellers can publish products/services.
 */
async function checkPublishPermission(req, res) {
  return res.status(200).json({
    success: true,
    canPublish: true,
    verificationStatus: req.sellerProfile.verificationStatus,
    message: 'Verified seller is authorized to publish products or services.',
  });
}

/**
 * GET /api/seller/portfolio-image/:storageKey
 * Allows the owning seller to preview their own uploaded sample work images safely.
 */
async function getOwnPortfolioImage(req, res, next) {
  try {
    const { storageKey } = req.params;
    const profile = await SellerProfile.findOne({ userId: req.user._id }).lean();
    const image = profile?.portfolio?.images?.find(
      (img) => img.storageKey === storageKey
    );

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio image not found.',
      });
    }

    const filePath = resolveSafeStoragePath(getPortfolioUploadDir(), image.storageKey);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio image file is unavailable.',
      });
    }

    res.setHeader('Content-Type', image.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(filePath);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  activateSellerMode,
  getSellerProfile,
  updateSellerProfile,
  getVerificationStatus,
  submitVerification,
  resubmitVerification,
  checkPublishPermission,
  getOwnPortfolioImage,
};
