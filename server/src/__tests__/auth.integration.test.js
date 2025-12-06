const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Item = require('../models/Item');
const { ROLES } = require('../config/constants');

let mongo;
let token;

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  mongo = await MongoMemoryServer.create();
  await connectDB(mongo.getUri());
  await User.create({
    name: 'Admin',
    username: 'admin',
    passwordHash: await bcrypt.hash('pass123', 10),
    role: ROLES.ADMIN,
  });
  await User.create({
    name: 'Cashier',
    username: 'cashier',
    passwordHash: await bcrypt.hash('cash123', 10),
    role: ROLES.CASHIER,
  });
  await Item.create({ name: 'Test Item', price: 10, quantity: 5 });
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
});

describe('auth + checkout flow', () => {
  test('logs in and receives JWT', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'cashier', password: 'cash123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test('creates a sale cart and checks out', async () => {
    const createRes = await request(app)
      .post('/api/carts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'sale' });
    expect(createRes.statusCode).toBe(201);
    const cartId = createRes.body._id;

    const item = await Item.findOne({ name: 'Test Item' });
    const addRes = await request(app)
      .post(`/api/carts/${cartId}/lines`)
      .set('Authorization', `Bearer ${token}`)
      .send({ itemId: item._id.toString(), qty: 1 });
    expect(addRes.statusCode).toBe(200);

    const checkoutRes = await request(app)
      .post(`/api/carts/${cartId}/checkout`)
      .set('Authorization', `Bearer ${token}`)
      .send({ payment: { method: 'cash', cashGiven: 20 } });
    expect(checkoutRes.statusCode).toBe(201);
    expect(checkoutRes.body.total).toBeGreaterThan(0);
    expect(checkoutRes.body.invoiceId).toMatch(/INV-/);
  });
});
