const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['member', 'admin'],
    required: true
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  discriminatorKey: 'role'
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

// Member Schema
const MemberSchema = new mongoose.Schema({
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Please add date of birth']
  },
  savingsBalance: {
    type: Number,
    default: 0
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  nationalId: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  }
});

// Admin Schema
const AdminSchema = new mongoose.Schema({
  permissions: [{
    type: String,
    enum: ['manage_members', 'approve_loans', 'view_reports', 'send_notifications', 'manage_savings']
  }],
  department: String
});

// Create models
const Member = User.discriminator('member', MemberSchema);
const Admin = User.discriminator('admin', AdminSchema);

module.exports = { User, Member, Admin }; 