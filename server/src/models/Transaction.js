const mongoose = require('mongoose');
const { TRANSACTION_TYPES, PAYMENT_METHODS } = require('../config/constants');

const lineSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },
    cashGiven: { type: Number, min: 0 },
    cashBack: { type: Number, min: 0 },
    cardLast4: { type: String },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(TRANSACTION_TYPES), required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    items: [lineSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, required: true },
    total: { type: Number, required: true },
    lateFees: { type: Number, default: 0 },
    payment: paymentSchema,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invoiceId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
