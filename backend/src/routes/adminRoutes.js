const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const {
  protect,
  authorizeRoles,
  requireDatabase,
} = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(requireDatabase);
router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/dashboard', adminController.getDashboardStats);

router.get('/verifications', adminController.listVerifications);

router.get('/verifications/:id', adminController.getVerificationDetail);

router.get(
  '/verifications/:id/documents/:docType',
  adminController.streamVerificationDocument
);

router.get(
  '/verifications/:id/portfolio/:storageKey',
  adminController.streamVerificationPortfolioImage
);

router.patch(
  '/verifications/:id/approve',
  adminController.approveVerification
);

router.patch(
  '/verifications/:id/reject',
  [
    body('rejectionReason')
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Please provide a clear rejection reason (at least 5 characters).'),
  ],
  handleValidationErrors,
  adminController.rejectVerification
);

module.exports = router;
