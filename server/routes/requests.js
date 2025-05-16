const express = require('express');
const router = express.Router();
const PaymentRequest = require('../models/PaymentRequest');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Create a new payment request
router.post('/', auth, async (req, res) => {
  try {
    const { receiverAccountNumber, amount, note } = req.body;
    const senderId = req.user._id;

    // Find receiver
    const receiver = await User.findOne({ accountNumber: receiverAccountNumber });
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver account not found' });
    }

    // Prevent self-request
    if (receiverAccountNumber === req.user.accountNumber) {
      return res.status(400).json({ message: 'Cannot request payment from yourself' });
    }

    // Create payment request
    const paymentRequest = new PaymentRequest({
      sender: senderId,
      receiver: receiver._id,
      amount,
      note
    });

    await paymentRequest.save();

    res.status(201).json({
      message: 'Payment request sent successfully',
      paymentRequest
    });
  } catch (error) {
    console.error('Payment request error:', error);
    res.status(500).json({ message: 'Error creating payment request', error: error.message });
  }
});

// Get all payment requests for the current user (both sent and received)
router.get('/', auth, async (req, res) => {
  try {
    const requests = await PaymentRequest.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'firstName lastName accountNumber')
    .populate('receiver', 'firstName lastName accountNumber');

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment requests', error: error.message });
  }
});

// Accept a payment request
router.put('/:requestId/accept', auth, async (req, res) => {
  try {
    const { pin } = req.body;
    const paymentRequest = await PaymentRequest.findById(req.params.requestId)
      .populate('sender', 'accountNumber')
      .populate('receiver', 'accountNumber balance');

    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    if (paymentRequest.receiver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    if (paymentRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Payment request is no longer pending' });
    }

    // Verify PIN
    const user = await User.findById(req.user._id);
    const isPinValid = await user.comparePin(pin);
    if (!isPinValid) {
      return res.status(400).json({ message: 'Invalid PIN' });
    }

    // Check if user has sufficient balance
    if (user.balance < paymentRequest.amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create transaction
    const transaction = new Transaction({
      sender: req.user._id,
      receiver: paymentRequest.sender._id,
      amount: paymentRequest.amount,
      type: 'transfer',
      note: paymentRequest.note,
      paymentRequest: paymentRequest._id
    });

    // Update balances
    user.balance -= paymentRequest.amount;
    const sender = await User.findById(paymentRequest.sender._id);
    sender.balance += paymentRequest.amount;

    // Update payment request status
    paymentRequest.status = 'accepted';

    // Save all changes
    await Promise.all([
      transaction.save(),
      user.save(),
      sender.save(),
      paymentRequest.save()
    ]);

    // If this payment request is linked to a group expense, update the member status
    if (paymentRequest.groupExpense) {
      const GroupExpense = require('../models/GroupExpense');
      const groupExpense = await GroupExpense.findById(paymentRequest.groupExpense);
      if (groupExpense) {
        const member = groupExpense.members.find(m => m.user.toString() === paymentRequest.receiver._id.toString());
        if (member) {
          member.status = 'paid';
          // If all members are paid, mark group expense as completed
          if (groupExpense.members.every(m => m.status === 'paid')) {
            groupExpense.status = 'completed';
          }
          await groupExpense.save();
        }
      }
    }

    res.json({
      message: 'Payment request accepted and processed successfully',
      transaction,
      newBalance: user.balance
    });
  } catch (error) {
    console.error('Accept payment request error:', error);
    res.status(500).json({ message: 'Error processing payment request', error: error.message });
  }
});

// Decline a payment request
router.put('/:requestId/decline', auth, async (req, res) => {
  try {
    const paymentRequest = await PaymentRequest.findById(req.params.requestId);

    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    if (paymentRequest.receiver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to decline this request' });
    }

    if (paymentRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Payment request is no longer pending' });
    }

    paymentRequest.status = 'declined';
    await paymentRequest.save();

    res.json({
      message: 'Payment request declined successfully',
      paymentRequest
    });
  } catch (error) {
    console.error('Decline payment request error:', error);
    res.status(500).json({ message: 'Error declining payment request', error: error.message });
  }
});

module.exports = router; 