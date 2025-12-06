const Customer = require('../models/Customer');

async function upsertByPhone(phone) {
  let customer = await Customer.findOne({ phone });
  if (!customer) {
    customer = await Customer.create({ phone, rentals: [] });
  }
  return customer;
}

async function ensureCustomer(req, res) {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone required' });
  const customer = await upsertByPhone(phone);
  res.json(customer);
}

async function getOutstandingRentals(req, res) {
  const { phone } = req.params;
  const customer = await Customer.findOne({ phone }).populate('rentals.item');
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  const outstanding = customer.rentals.filter((r) => r.status === 'out');
  res.json(outstanding);
}

module.exports = { ensureCustomer, getOutstandingRentals, upsertByPhone };
