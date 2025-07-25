const express = require('express');
const { check } = require('express-validator');
const {
  register,
  login,
  getMe,
  logout,
  createAdmin
} = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Custom phone number validation
const validatePhoneNumber = (value) => {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');

  // Check if it starts with 0 and has exactly 10 digits
  const phoneRegex = /^0\d{9}$/;

  if (!phoneRegex.test(cleaned)) {
    throw new Error('Phone number must start with 0 and be exactly 10 digits (e.g., 0712345678)');
  }

  return true;
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 8 or more characters').isLength({ min: 8 }),
  check('phoneNumber').custom(validatePhoneNumber),
  check('address', 'Address is required').not().isEmpty()
], register);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], login);

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticate, getMe);

// @desc    Log user out
// @route   GET /api/auth/logout
// @access  Private
router.get('/logout', authenticate, logout);

// @desc    Create default admin account
// @route   POST /api/auth/create-admin
// @access  Private/Admin
router.post('/create-admin', authenticate, authorize('admin'), createAdmin);

module.exports = router; 