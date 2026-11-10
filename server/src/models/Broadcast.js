const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Broadcast title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    message: {
      type: String,
      required: [true, 'Broadcast announcement message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'alert'],
      default: 'info',
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'TRIAL_ONLY', 'EXPIRED_ONLY'],
      default: 'ALL',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdByName: {
      type: String,
      default: 'Super Admin (Naveed)',
    },
  },
  {
    timestamps: true,
  }
);

broadcastSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Broadcast', broadcastSchema);
