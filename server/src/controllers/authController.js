const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

async function login(req, res) {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
  await AuditLog.create({ actor: user._id, action: 'login' });
  res.json({
    token,
    user: {
      id: user._id,
      employeeId: user.employeeId,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      username: user.username,
    },
  });
}

async function logout(req, res) {
  if (req.user) {
    await AuditLog.create({ actor: req.user._id, action: 'logout' });
  }
  res.json({ message: 'Logged out' });
}

module.exports = { login, logout };
