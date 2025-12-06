const Coupon = require('../models/Coupon');

async function listCoupons(_req, res) {
  const coupons = await Coupon.find().lean();
  res.json(coupons);
}

async function createCoupon(req, res) {
  const { code, pctOff, active, expiresAt } = req.body;
  const exists = await Coupon.findOne({ code: code.toUpperCase() });
  if (exists) return res.status(400).json({ message: 'Coupon exists' });
  const coupon = await Coupon.create({ code: code.toUpperCase(), pctOff, active, expiresAt });
  res.status(201).json(coupon);
}

async function updateCoupon(req, res) {
  const { id } = req.params;
  const { pctOff, active, expiresAt } = req.body;
  const coupon = await Coupon.findById(id);
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
  if (pctOff !== undefined) coupon.pctOff = pctOff;
  if (active !== undefined) coupon.active = active;
  if (expiresAt !== undefined) coupon.expiresAt = expiresAt;
  await coupon.save();
  res.json(coupon);
}

async function validateCoupon(req, res) {
  const { code } = req.params;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
  if (!coupon) return res.status(404).json({ message: 'Invalid coupon' });
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Coupon expired' });
  }
  res.json(coupon);
}

module.exports = { listCoupons, createCoupon, updateCoupon, validateCoupon };
