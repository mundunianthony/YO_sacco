const express = require('express');
const { check } = require('express-validator');
const {
  register,
  login,
  getMe,
  logout
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({ min: 8 }),
    check('phoneNumber', 'Phone number is required').not().isEmpty(),
    check('address', 'Address is required').not().isEmpty()
  ],
  register
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  login
);

router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router; 