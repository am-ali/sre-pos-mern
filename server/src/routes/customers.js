const express = require('express');
const { ensureCustomer, getOutstandingRentals } = require('../controllers/customerController');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.post('/ensure', auth, ensureCustomer);
router.get('/:phone/rentals', auth, getOutstandingRentals);

module.exports = router;
