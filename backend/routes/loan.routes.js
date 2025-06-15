const express = require('express');
const { check } = require('express-validator');
const {
  applyLoan,
  getMyLoans,
  getAllLoans,
  updateLoanStatus
} = require('../controllers/loan.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  protect,
  [
    check('amount', 'Amount is required').isNumeric(),
    check('purpose', 'Purpose is required').not().isEmpty(),
    check('term', 'Term is required').isNumeric()
  ],
  applyLoan
);

router.get('/my-loans', protect, getMyLoans);
router.get('/', protect, authorize('admin'), getAllLoans);
router.put('/:id', protect, authorize('admin'), updateLoanStatus);

module.exports = router; 