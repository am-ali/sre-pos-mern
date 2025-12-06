const dayInMs = 24 * 60 * 60 * 1000;

function applyCoupon(subtotal, coupon) {
  if (!coupon) return { discount: 0, subtotalAfterDiscount: subtotal };
  const pct = coupon.pctOff || 0;
  const discount = subtotal * pct;
  return { discount, subtotalAfterDiscount: subtotal - discount };
}

function applyTax(subtotal, taxRate) {
  const tax = subtotal * taxRate;
  return { tax, total: subtotal + tax };
}

function computeLateFee({ qty, price, dueAt, now = new Date() }) {
  const daysLate = Math.max(0, Math.floor((now - dueAt) / dayInMs));
  const fee = qty * price * 0.1 * daysLate;
  return { daysLate, fee };
}

module.exports = { applyCoupon, applyTax, computeLateFee };
