const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ROLES } = require('../config/constants');

async function listUsers(_req, res) {
  const users = await User.find().select('-passwordHash').lean();
  res.json(users);
}

async function createUser(req, res) {
  const { firstName, lastName, password, role } = req.body;
  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  // Auto-generate username from first/last name
  const baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  let username = baseUsername;
  let counter = 1;
  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  // Auto-generate employeeId
  const maxEmployee = await User.findOne().sort({ employeeId: -1 }).lean();
  const nextId = maxEmployee ? String(parseInt(maxEmployee.employeeId) + 1).padStart(6, '0') : '110001';
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ employeeId: nextId, firstName, lastName, username, passwordHash, role });
  res.status(201).json({
    id: user._id,
    employeeId: user.employeeId,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    role: user.role,
  });
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { firstName, lastName, password, role } = req.body;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (role && !Object.values(ROLES).includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (role) user.role = role;
  if (password) user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();
  res.json({
    id: user._id,
    employeeId: user.employeeId,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    role: user.role,
  });
}

async function deleteUser(req, res) {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
  if (user.role === ROLES.ADMIN && adminCount <= 1) {
    return res.status(400).json({ message: 'Cannot delete last admin' });
  }
  await user.deleteOne();
  res.json({ message: 'User deleted' });
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
