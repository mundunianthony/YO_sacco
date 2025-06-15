const express = require('express');
const { check } = require('express-validator');
const {
  applyForLoan,
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
    check('amount', 'Minimum loan amount is 1000').isFloat({ min: 1000 }),
    check('purpose', 'Purpose is required').not().isEmpty(),
    check('term', 'Term is required').isNumeric(),
    check('term', 'Term must be between 1 and 36 months').isInt({ min: 1, max: 36 }),
    check('collateral', 'Collateral is optional').optional(),
    check('guarantors', 'Guarantors must be an array').optional().isArray(),
    check('guarantors.*.name', 'Guarantor name is required').optional().not().isEmpty(),
    check('guarantors.*.phone', 'Guarantor phone is required').optional().not().isEmpty(),
    check('guarantors.*.address', 'Guarantor address is required').optional().not().isEmpty(),
    check('guarantors.*.relationship', 'Guarantor relationship is required').optional().not().isEmpty()
  ],
  applyForLoan
);

router.get('/my-loans', protect, getMyLoans);
router.get('/', protect, authorize('admin'), getAllLoans);
router.put('/:id', protect, authorize('admin'), updateLoanStatus);

module.exports = router; 