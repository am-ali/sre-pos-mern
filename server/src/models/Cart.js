const mongoose = require('mongoose');
const { CART_TYPES } = require('../config/constants');

const cartLineSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    qty: { type: Number, required: true, min: 1 },
    priceAtAdd: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    type: { type: String, enum: Object.values(CART_TYPES), required: true },
    couponCode: { type: String },
    lines: [cartLineSchema],
    status: { type: String, enum: ['draft', 'completed'], default: 'draft' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
