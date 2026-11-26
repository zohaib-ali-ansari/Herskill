const express = require('express');
const { body } = require('express-validator');
const sellerController = require('../controllers/sellerController');
const {
  protect,
  authorizeRoles,
  requireVerifiedSeller,
  requireDatabase,
} = require('../middleware/authMiddleware');
const { verificationUpload } = require('../middleware/uploadMiddleware');
const { handleValidationErrors } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(requireDatabase);
router.use(protect);

const baseVerificationValidators = [
  body('legalName')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Legal full name is required.'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Valid date of birth is required.')
    .custom((value) => {
      const dob = new Date(value);
      const ageMs = Date.now() - dob.getTime();
      const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
      if (ageYears < 18) {
        throw new Error('Applicants must be at least 18 years old.');
      }
      return true;
    }),
  body('phone')
    .trim()
    .matches(/^[+\d][\d\s-]{8,18}$/)
    .withMessage('Valid phone number is required.'),
  body('email').trim().isEmail().withMessage('Valid email address is required.'),
  body('city').trim().isLength({ min: 2, max: 80 }).withMessage('City is required.'),
  body('residentialAddress')
    .trim()
    .isLength({ min: 5, max: 300 })
    .withMessage('Residential address is required.'),
  body('businessName')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Store or business name is required.'),
  body('businessDescription')
    .trim()
    .isLength({ min: 20, max: 1500 })
    .withMessage('Business description must be at least 20 characters.'),
  body('socialLink')
    .optional({ values: 'falsy' })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Social or portfolio link must be a valid http/https URL.'),
];

const cnicRequiredValidator = body('cnicNumber')
  .trim()
  .matches(/^\d{5}-?\d{7}-?\d{1}$/)
  .withMessage('Enter a valid 13-digit CNIC number (e.g., 12345-1234567-1).');

const cnicOptionalValidator = body('cnicNumber')
  .optional({ values: 'falsy' })
  .trim()
  .matches(/^\d{5}-?\d{7}-?\d{1}$/)
  .withMessage('Enter a valid 13-digit CNIC number (e.g., 12345-1234567-1).');

router.post('/activate', sellerController.activateSellerMode);

router.get('/profile', sellerController.getSellerProfile);

router.patch(
  '/profile',
  authorizeRoles('seller'),
  [
    body('businessName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage('Store or business name must be between 2 and 120 characters.'),
    body('businessDescription')
      .optional()
      .trim()
      .isLength({ min: 20, max: 1500 })
      .withMessage('Business description must be at least 20 characters.'),
    body('city')
      .optional()
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('City must be between 2 and 80 characters.'),
    body('residentialAddress')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ min: 5, max: 300 })
      .withMessage('Residential address must be at least 5 characters.'),
    body('phone')
      .optional()
      .trim()
      .matches(/^[+\d][\d\s-]{8,18}$/)
      .withMessage('Valid phone number is required.'),
    body('socialLink')
      .optional({ values: 'falsy' })
      .trim()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Social or portfolio link must be a valid http/https URL.'),
  ],
  handleValidationErrors,
  sellerController.updateSellerProfile
);

router.get('/verification-status', sellerController.getVerificationStatus);

router.post(
  '/verification',
  authorizeRoles('seller'),
  verificationUpload,
  [...baseVerificationValidators, cnicRequiredValidator],
  handleValidationErrors,
  sellerController.submitVerification
);

router.put(
  '/verification/resubmit',
  authorizeRoles('seller'),
  verificationUpload,
  [...baseVerificationValidators, cnicOptionalValidator],
  handleValidationErrors,
  sellerController.resubmitVerification
);

router.get(
  '/portfolio-image/:storageKey',
  authorizeRoles('seller'),
  sellerController.getOwnPortfolioImage
);

// Backend enforcement guard confirming only APPROVED sellers can publish
router.post(
  '/publish-check',
  authorizeRoles('seller'),
  requireVerifiedSeller,
  sellerController.checkPublishPermission
);

module.exports = router;
