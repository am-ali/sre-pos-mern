const { applyCoupon, applyTax, computeLateFee } = require('../utils/pricing');

describe('pricing utils', () => {
  test('applies coupon percent', () => {
    const { discount, subtotalAfterDiscount } = applyCoupon(100, { pctOff: 0.1 });
    expect(discount).toBeCloseTo(10);
    expect(subtotalAfterDiscount).toBeCloseTo(90);
  });

  test('applies tax rate', () => {
    const { tax, total } = applyTax(100, 0.06);
    expect(tax).toBeCloseTo(6);
    expect(total).toBeCloseTo(106);
  });

  test('computes late fee by days', () => {
    const dueAt = new Date('2024-01-01T00:00:00Z');
    const now = new Date('2024-01-04T00:00:00Z');
    const { daysLate, fee } = computeLateFee({ qty: 2, price: 10, dueAt, now });
    expect(daysLate).toBe(3);
    expect(fee).toBeCloseTo(6);
  });
});
