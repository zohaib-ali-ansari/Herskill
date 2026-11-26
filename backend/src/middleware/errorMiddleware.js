const multer = require('multer');
const { cleanupUploadedFiles } = require('./uploadMiddleware');

function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: 'Requested endpoint was not found.',
  });
}

function errorHandler(err, req, res, next) {
  cleanupUploadedFiles(req);

  if (err instanceof multer.MulterError) {
    let message = 'File upload error.';
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = Number(process.env.MAX_DOCUMENT_SIZE_MB) || 5;
      message = `Uploaded file exceeds the maximum allowed size of ${maxMb}MB.`;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected upload field or too many files uploaded.';
    }
    return res.status(400).json({ success: false, message });
  }

  if (err && err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || {})[0] || 'account';
    return res.status(409).json({
      success: false,
      message: `An account with this ${duplicateField} already exists.`,
    });
  }

  if (err && err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource identifier.',
    });
  }

  const statusCode = err.statusCode || 500;
  const safeMessage =
    statusCode < 500
      ? err.message
      : 'An unexpected server error occurred. Please try again.';

  if (statusCode >= 500) {
    console.error('[ServerError]', err.message);
  }

  return res.status(statusCode).json({
    success: false,
    message: safeMessage,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
