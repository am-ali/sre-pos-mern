const express = require('express');
const { checkoutCart, listTransactions } = require('../controllers/transactionController');
const { auth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();
router.get('/', auth, requireRole(ROLES.ADMIN), listTransactions);
router.post('/:id/checkout', auth, checkoutCart);

module.exports = router;
