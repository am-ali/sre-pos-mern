const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const itemRoutes = require('./items');
const couponRoutes = require('./coupons');
const cartRoutes = require('./carts');
const transactionRoutes = require('./transactions');
const customerRoutes = require('./customers');

const router = express.Router();
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/items', itemRoutes);
router.use('/coupons', couponRoutes);
router.use('/carts', cartRoutes);
router.use('/transactions', transactionRoutes);
router.use('/customers', customerRoutes);

module.exports = router;
