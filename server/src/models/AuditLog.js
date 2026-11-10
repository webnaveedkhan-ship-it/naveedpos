const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    actorName: {
      type: String,
      default: 'Naveed (Super Admin)',
    },
    actorEmail: {
      type: String,
      default: 'naveed@naveedpos.com',
    },
    action: {
      type: String,
      required: true,
      enum: [
        'PLAN_OVERRIDE',
        'STORE_SUSPENDED',
        'STORE_ACTIVATED',
        'SUBSCRIPTION_EXTENDED',
        'PAYMENT_APPROVED',
        'PAYMENT_REJECTED',
        'IMPERSONATION_STARTED',
        'DATA_PURGED',
        'BROADCAST_PUBLISHED',
        'BROADCAST_DELETED',
      ],
    },
    targetTenantId: {
      type: mongoose.Schema.Types.Mixed, // string or ObjectId
      required: false,
    },
    targetTenantName: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexed for fast super admin audit browsing
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ targetTenantId: 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
