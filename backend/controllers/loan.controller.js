const Loan = require('../models/Loan');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Apply for a loan
// @route   POST /api/loans
// @access  Private
exports.applyLoan = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { amount, purpose, term } = req.body;

    // Calculate monthly payment and total payment
    const interestRate = 10; // 10% interest rate
    const totalInterest = (amount * interestRate * term) / 100;
    const totalPayment = amount + totalInterest;
    const monthlyPayment = totalPayment / term;

    const loan = await Loan.create({
      user: req.user.id,
      amount,
      purpose,
      term,
      interestRate,
      monthlyPayment,
      totalPayment
    });

    res.status(201).json({
      success: true,
      data: loan
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all loans for a user
// @route   GET /api/loans/my-loans
// @access  Private
exports.getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.user.id });
    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all loans (admin only)
// @route   GET /api/loans
// @access  Private/Admin
exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find().populate('user', 'name email');
    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Update loan status
// @route   PUT /api/loans/:id
// @access  Private/Admin
exports.updateLoanStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ msg: 'Loan not found' });
    }

    loan.status = status;
    if (status === 'approved') {
      loan.approvedBy = req.user.id;
      loan.approvedAt = Date.now();
    }

    await loan.save();

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}; 