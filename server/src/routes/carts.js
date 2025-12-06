const express = require('express');
const { createCart, getCart, addLine, removeLine, applyCoupon } = require('../controllers/cartController');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.post('/', auth, createCart);
router.get('/:id', auth, getCart);
router.post('/:id/lines', auth, addLine);
router.delete('/:id/lines/:itemId', auth, removeLine);
router.post('/:id/coupon', auth, applyCoupon);

module.exports = router;
