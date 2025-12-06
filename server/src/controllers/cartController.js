const Cart = require('../models/Cart');
const Item = require('../models/Item');
const Coupon = require('../models/Coupon');
const { CART_TYPES } = require('../config/constants');
const { upsertByPhone } = require('./customerController');

async function createCart(req, res) {
  const { type, phone } = req.body;
  if (!Object.values(CART_TYPES).includes(type)) {
    return res.status(400).json({ message: 'Invalid cart type' });
  }
  let customerId;
  if (type === CART_TYPES.RENTAL || type === CART_TYPES.RETURN) {
    if (!phone) return res.status(400).json({ message: 'Phone required for rental/return' });
    const customer = await upsertByPhone(phone);
    customerId = customer._id;
  }
  const cart = await Cart.create({ user: req.user._id, type, customer: customerId, lines: [], status: 'draft' });
  res.status(201).json(cart);
}

async function getCart(req, res) {
  const { id } = req.params;
  const cart = await Cart.findById(id).populate('lines.item');
  if (!cart) return res.status(404).json({ message: 'Cart not found' });
  res.json(cart);
}

async function addLine(req, res) {
  const { id } = req.params;
  const { itemId, qty } = req.body;
  const cart = await Cart.findById(id);
  if (!cart) return res.status(404).json({ message: 'Cart not found' });
  if (cart.status !== 'draft') return res.status(400).json({ message: 'Cart closed' });
  const item = await Item.findById(itemId);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  const existing = cart.lines.find((l) => l.item.toString() === itemId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.lines.push({ item: item._id, qty, priceAtAdd: item.price });
  }
  await cart.save();
  res.json(cart);
}

async function removeLine(req, res) {
  const { id, itemId } = req.params;
  const cart = await Cart.findById(id);
  if (!cart) return res.status(404).json({ message: 'Cart not found' });
  cart.lines = cart.lines.filter((l) => l.item.toString() !== itemId);
  await cart.save();
  res.json(cart);
}

async function applyCoupon(req, res) {
  const { id } = req.params;
  const { code } = req.body;
  const cart = await Cart.findById(id);
  if (!cart) return res.status(404).json({ message: 'Cart not found' });
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
  if (!coupon) return res.status(404).json({ message: 'Invalid coupon' });
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Coupon expired' });
  }
  cart.couponCode = coupon.code;
  await cart.save();
  res.json(cart);
}

module.exports = { createCart, getCart, addLine, removeLine, applyCoupon };
