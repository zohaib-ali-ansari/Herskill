const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect, requireDatabase } = require('../middleware/authMiddleware');
const { loginLimiter, authActionLimiter } = require('../middleware/rateLimiter');
const { handleValidationErrors } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(requireDatabase);

router.post(
  '/register',
  authActionLimiter,
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters.'),
    body('email').trim().isEmail().withMessage('Please enter a valid email address.'),
    body('phone')
      .trim()
      .matches(/^[+\d][\d\s-]{8,18}$/)
      .withMessage('Please enter a valid phone number.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match.'),
    body('accountType')
      .isIn(['buyer', 'seller'])
      .withMessage('Account type must be either buyer or seller.'),
  ],
  handleValidationErrors,
  authController.register
);

router.post(
  '/login',
  loginLimiter,
  [
    body('identifier')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Email or phone number is required.'),
    body('email').optional().trim(),
    body().custom((value) => {
      if (!value.identifier && !value.email) {
        throw new Error('Email or phone number is required.');
      }
      return true;
    }),
    body('password').notEmpty().withMessage('Password is required.'),
    body('requestedMode')
      .optional()
      .isIn(['buyer', 'seller'])
      .withMessage('Requested mode must be buyer or seller.'),
  ],
  handleValidationErrors,
  authController.login
);

router.post(
  '/admin/login',
  loginLimiter,
  [
    body('email').trim().isEmail().withMessage('Valid administrator email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  handleValidationErrors,
  authController.adminLogin
);

router.post('/logout', protect, authController.logout);

router.get('/me', protect, authController.getMe);

router.post(
  '/verify-contact',
  protect,
  authActionLimiter,
  [
    body('code')
      .trim()
      .isLength({ min: 4, max: 12 })
      .withMessage('A valid verification code is required.'),
    body('method')
      .optional()
      .isIn(['email', 'phone'])
      .withMessage('Verification method must be email or phone.'),
  ],
  handleValidationErrors,
  authController.verifyContact
);

router.post(
  '/resend-verification',
  protect,
  authActionLimiter,
  authController.resendVerification
);

router.post(
  '/forgot-password',
  authActionLimiter,
  [body('email').trim().isEmail().withMessage('Please enter a valid email address.')],
  handleValidationErrors,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authActionLimiter,
  [
    body('token').trim().notEmpty().withMessage('Reset token is required.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match.'),
  ],
  handleValidationErrors,
  authController.resetPassword
);

router.patch(
  '/switch-mode',
  protect,
  [
    body('mode')
      .isIn(['buyer', 'seller'])
      .withMessage('Mode must be buyer or seller.'),
  ],
  handleValidationErrors,
  authController.switchMode
);

router.patch(
  '/profile',
  protect,
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters.'),
    body('phone')
      .trim()
      .matches(/^[+\d][\d\s-]{8,18}$/)
      .withMessage('Please enter a valid phone number.'),
  ],
  handleValidationErrors,
  authController.updateProfile
);

router.patch(
  '/change-password',
  protect,
  authActionLimiter,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required.'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long.'),
    body('confirmNewPassword')
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('New passwords do not match.'),
  ],
  handleValidationErrors,
  authController.changePassword
);

module.exports = router;
