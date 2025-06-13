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

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('phoneNumber', 'Phone number is required').not().isEmpty(),
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