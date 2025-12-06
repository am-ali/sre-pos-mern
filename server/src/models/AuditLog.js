const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    meta: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditSchema);
