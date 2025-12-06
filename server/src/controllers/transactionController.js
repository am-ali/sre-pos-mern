const Item = require('../models/Item');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const { CART_TYPES, PAYMENT_METHODS, TRANSACTION_TYPES } = require('../config/constants');
const { applyCoupon, applyTax, computeLateFee } = require('../utils/pricing');
const { invoiceId } = require('../utils/id');

async function adjustInventory(itemId, qtyDelta) {
  const item = await Item.findById(itemId);
  if (!item) throw new Error('Item not found');
  const newQty = item.quantity + qtyDelta;
  if (newQty < 0) throw Object.assign(new Error('Insufficient stock'), { status: 400 });
  item.quantity = newQty;
  await item.save();
  return item;
}

async function checkoutCart(req, res) {
  const { id } = req.params;
  const { payment, cardNumber } = req.body;
  const cart = await Cart.findById(id).populate('lines.item');
  if (!cart) return res.status(404).json({ message: 'Cart not found' });
  if (cart.status !== 'draft') return res.status(400).json({ message: 'Cart already processed' });

  let coupon;
  if (cart.couponCode) {
    coupon = await Coupon.findOne({ code: cart.couponCode, active: true });
    if (coupon && coupon.expiresAt && coupon.expiresAt < new Date()) coupon = null;
  }

  const taxRate = Number(process.env.DEFAULT_TAX_RATE || 0.06);
  const now = new Date();
  let subtotal = cart.lines.reduce((acc, l) => acc + l.priceAtAdd * l.qty, 0);
  let discount = 0;
  let tax = 0;
  let total = subtotal;
  let lateFees = 0;
  let customer;

  if (cart.customer) {
    customer = await Customer.findById(cart.customer);
  }

  if (cart.type === CART_TYPES.RETURN) {
    // Rental returns: compute late fees, restock inventory.
    if (!customer) return res.status(400).json({ message: 'Customer required for return' });
    for (const line of cart.lines) {
      const rental = customer.rentals.find((r) => r.status === 'out' && r.item.toString() === line.item.toString());
      if (!rental) throw Object.assign(new Error('Rental not found for item'), { status: 400 });
      const { fee } = computeLateFee({ qty: line.qty, price: rental.priceAtRent, dueAt: rental.dueAt, now });
      lateFees += fee;
      rental.returnedAt = now;
      rental.status = 'returned';
      await adjustInventory(line.item, line.qty);
    }
    subtotal = 0;
    tax = 0;
    discount = 0;
    total = lateFees;
    await customer.save();
  } else if (cart.type === CART_TYPES.UNSATISFACTORY) {
    for (const line of cart.lines) {
      await adjustInventory(line.item, line.qty);
    }
    subtotal = 0;
    tax = 0;
    discount = 0;
    total = 0;
  } else {
    // Sale or rental
    if (coupon) {
      const resCoupon = applyCoupon(subtotal, coupon);
      discount = resCoupon.discount;
      subtotal = resCoupon.subtotalAfterDiscount;
    }
    const taxed = applyTax(subtotal, taxRate);
    tax = taxed.tax;
    total = taxed.total;

    // Inventory checks and rental booking
    for (const line of cart.lines) {
      await adjustInventory(line.item, -line.qty);
      if (cart.type === CART_TYPES.RENTAL && customer) {
        customer.rentals.push({
          item: line.item,
          qty: line.qty,
          priceAtRent: line.priceAtAdd,
          rentedAt: now,
          dueAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        });
      }
    }
    if (customer) await customer.save();
  }

  // Payment validation
  if (!payment || !payment.method) return res.status(400).json({ message: 'Payment required' });
  if (![PAYMENT_METHODS.CASH, PAYMENT_METHODS.ELECTRONIC].includes(payment.method)) {
    return res.status(400).json({ message: 'Unsupported payment method' });
  }
  if (payment.method === PAYMENT_METHODS.CASH) {
    if (payment.cashGiven === undefined) return res.status(400).json({ message: 'cashGiven required' });
    if (payment.cashGiven < total) return res.status(400).json({ message: 'Insufficient cash' });
    payment.cashBack = payment.cashGiven - total;
  } else if (payment.method === PAYMENT_METHODS.ELECTRONIC) {
    if (!cardNumber || !/^\d{16}$/.test(cardNumber)) {
      return res.status(400).json({ message: 'Invalid card' });
    }
    payment.cardLast4 = cardNumber.slice(-4);
    if (payment.cashBack && payment.cashBack > total) {
      return res.status(400).json({ message: 'Cashback exceeds total' });
    }
  }

  const txn = await Transaction.create({
    type: cart.type,
    customer: customer ? customer._id : undefined,
    items: cart.lines.map((l) => ({ item: l.item, qty: l.qty, price: l.priceAtAdd })),
    subtotal,
    tax,
    discount,
    total,
    lateFees,
    payment,
    createdBy: req.user._id,
    invoiceId: invoiceId(),
  });

  cart.status = 'completed';
  await cart.save();
  await AuditLog.create({ actor: req.user._id, action: `checkout_${cart.type}`, meta: { cart: cart._id, txn: txn._id } });

  res.status(201).json(txn);
}

async function listTransactions(_req, res) {
  const txns = await Transaction.find().sort({ createdAt: -1 }).lean();
  res.json(txns);
}

module.exports = { checkoutCart, listTransactions };
