const mongoose = require('mongoose');

const VERIFICATION_STATUSES = ['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'];

const portfolioImageSchema = new mongoose.Schema(
  {
    storageKey: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const sellerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    legalName: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
    },
    contactInformation: {
      phone: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
    },
    address: {
      city: { type: String, trim: true, default: '' },
      residentialAddress: { type: String, trim: true, default: '' },
    },
    businessName: {
      type: String,
      trim: true,
      default: '',
    },
    businessDescription: {
      type: String,
      trim: true,
      default: '',
    },
    categories: {
      type: [String],
      default: [],
    },
    portfolio: {
      images: { type: [portfolioImageSchema], default: [] },
      socialLink: { type: String, trim: true, default: '' },
    },
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'NOT_SUBMITTED',
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SellerProfile', sellerProfileSchema);
module.exports.VERIFICATION_STATUSES = VERIFICATION_STATUSES;
