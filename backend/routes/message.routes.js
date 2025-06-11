const express = require('express');
const { check } = require('express-validator');
const {
  sendMessage,
  getMyMessages,
  markAsRead,
  deleteMessage
} = require('../controllers/message.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  protect,
  [
    check('recipient', 'Recipient is required').not().isEmpty(),
    check('subject', 'Subject is required').not().isEmpty(),
    check('content', 'Content is required').not().isEmpty()
  ],
  sendMessage
);

router.get('/', protect, getMyMessages);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteMessage);

module.exports = router; 