const express = require('express');
const { listUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { auth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();
router.use(auth, requireRole(ROLES.ADMIN));
router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
