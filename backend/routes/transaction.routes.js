const express = require('express');
const { check } = require('express-validator');
const {
  createTransaction,
  getMyTransactions,
  getAllTransactions,
  updateTransactionStatus
} = require('../controllers/transaction.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  protect,
  [
    check('type', 'Type is required').isIn(['deposit', 'withdrawal', 'loan_payment', 'loan_disbursement']),
    check('amount', 'Amount is required').isNumeric(),
    check('description', 'Description is required').not().isEmpty()
  ],
  createTransaction
);

router.get('/my-transactions', protect, getMyTransactions);
router.get('/', protect, authorize('admin'), getAllTransactions);
router.put('/:id', protect, authorize('admin'), updateTransactionStatus);

module.exports = router; 