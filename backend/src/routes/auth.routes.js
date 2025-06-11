const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { validateRequest } = require('../middleware/validateRequest');
const { authenticate } = require('../middleware/auth');

// Validation middleware
const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

const registerValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
];

// Routes
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/register', registerValidation, validateRequest, authController.register);
router.get('/validate', authenticate, authController.validateToken);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-reset-token', authController.verifyResetToken);

module.exports = router; 