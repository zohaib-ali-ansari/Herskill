const mongoose = require('mongoose');
const { VERIFICATION_STATUSES } = require('./SellerProfile');

const documentRefSchema = new mongoose.Schema(
  {
    storageKey: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const historyEntrySchema = new mongoose.Schema(
  {
    submissionNumber: { type: Number, required: true },
    status: { type: String, enum: VERIFICATION_STATUSES, required: true },
    submittedAt: { type: Date, required: true },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, trim: true, default: '' },
    snapshot: {
      legalName: { type: String, default: '' },
      businessName: { type: String, default: '' },
      categories: { type: [String], default: [] },
      city: { type: String, default: '' },
    },
  },
  { _id: false }
);

const sellerVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    submittedInformation: {
      personal: {
        legalName: { type: String, required: true, trim: true },
        dateOfBirth: { type: Date, required: true },
        phone: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        city: { type: String, required: true, trim: true },
        residentialAddress: { type: String, required: true, trim: true },
      },
      identity: {
        cnicEncrypted: { type: String, required: true, select: false },
        cnicMasked: { type: String, required: true },
        cnicHash: { type: String, required: true, select: false },
      },
      business: {
        businessName: { type: String, required: true, trim: true },
        categories: { type: [String], required: true },
        businessDescription: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        socialLink: { type: String, trim: true, default: '' },
        portfolioCount: { type: Number, default: 0 },
      },
      declarationAccepted: {
        type: Boolean,
        required: true,
      },
    },
    secureDocumentReferences: {
      cnicFront: { type: documentRefSchema, required: true },
      cnicBack: { type: documentRefSchema, required: true },
      additionalDocument: { type: documentRefSchema, default: undefined },
    },
    status: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'PENDING',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    applicationHistory: {
      type: [historyEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SellerVerification', sellerVerificationSchema);
