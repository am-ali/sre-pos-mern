const express = require('express');
const { listCoupons, createCoupon, updateCoupon, validateCoupon } = require('../controllers/couponController');
const { auth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();
router.get('/', auth, listCoupons);
router.post('/', auth, requireRole(ROLES.ADMIN), createCoupon);
router.put('/:id', auth, requireRole(ROLES.ADMIN), updateCoupon);
router.get('/validate/:code', auth, validateCoupon);

module.exports = router;
