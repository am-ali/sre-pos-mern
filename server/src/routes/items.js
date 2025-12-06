const express = require('express');
const { listItems, createItem, updateItem, deleteItem } = require('../controllers/itemController');
const { auth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();
router.get('/', auth, listItems);
router.post('/', auth, requireRole(ROLES.ADMIN), createItem);
router.put('/:id', auth, requireRole(ROLES.ADMIN), updateItem);
router.delete('/:id', auth, requireRole(ROLES.ADMIN), deleteItem);

module.exports = router;
