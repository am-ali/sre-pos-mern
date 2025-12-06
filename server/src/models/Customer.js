const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    qty: { type: Number, required: true, min: 1 },
    priceAtRent: { type: Number, required: true, min: 0 },
    rentedAt: { type: Date, default: Date.now },
    dueAt: { type: Date, required: true },
    returnedAt: { type: Date },
    status: { type: String, enum: ['out', 'returned'], default: 'out' },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, trim: true },
    rentals: [rentalSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
