const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Member = require('../models/Member');
const { generateToken } = require('../utils/jwt');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const member = await Member.findOne({ email });
    if (!member) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(member._id);

    // Send response
    res.json({
      token,
      user: {
        id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        role: member.role || 'member'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    // Check if user already exists
    let member = await Member.findOne({ email });
    if (member) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new member
    member = new Member({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      memberId: `MEM${Date.now()}`,
      role: 'member'
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    member.password = await bcrypt.hash(password, salt);

    // Save member
    await member.save();

    // Generate token
    const token = generateToken(member._id);

    // Send response
    res.status(201).json({
      token,
      user: {
        id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        role: member.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Validate token
// @route   GET /api/auth/validate
// @access  Private
exports.validateToken = async (req, res) => {
  try {
    const member = await Member.findById(req.user.id).select('-password');
    if (!member) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        role: member.role
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const member = await Member.findOne({ email });
    
    if (!member) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: member._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Send reset email with token

    res.json({ message: 'Password reset instructions sent to your email' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify reset token
// @route   POST /api/auth/verify-reset-token
// @access  Public
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const member = await Member.findById(decoded.id);

    if (!member) {
      return res.status(404).json({ message: 'Invalid token' });
    }

    res.json({ message: 'Token is valid' });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(400).json({ message: 'Invalid token' });
  }
}; 