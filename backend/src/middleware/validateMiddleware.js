const { validationResult } = require('express-validator');
const { cleanupUploadedFiles } = require('./uploadMiddleware');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  cleanupUploadedFiles(req);

  const formatted = errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  return res.status(400).json({
    success: false,
    message: formatted[0]?.message || 'Validation failed.',
    errors: formatted,
  });
}

module.exports = { handleValidationErrors };
