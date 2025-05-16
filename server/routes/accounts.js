const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Get account balance
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching balance', error: error.message });
  }
});

// Deposit funds
router.post('/deposit', auth, async (req, res) => {
  try {
    const { amount, pin } = req.body;
    const userId = req.user._id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Maximum deposit limit (e.g., ₹100,000)
    if (amount > 100000) {
      return res.status(400).json({ message: 'Deposit amount exceeds maximum limit' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.pin) {
      return res.status(400).json({ message: 'You must set a 4-digit PIN before making transactions.' });
    }
    const isPinValid = await user.comparePin(pin);
    if (!isPinValid) {
      return res.status(400).json({ message: 'Invalid PIN' });
    }

    // Create transaction record
    const transaction = new Transaction({
      sender: userId,
      receiver: userId,
      amount,
      type: 'deposit',
      status: 'completed',
      category: 'deposit',
    });

    // Update balance
    user.balance += amount;

    // Save all changes in a transaction
    await Promise.all([
      transaction.save(),
      user.save()
    ]);

    res.json({
      message: 'Deposit successful',
      transaction,
      newBalance: user.balance
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Deposit failed' });
  }
});

// Withdraw funds
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { amount, pin } = req.body;
    const userId = req.user._id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Maximum withdrawal limit (e.g., ₹50,000)
    if (amount > 50000) {
      return res.status(400).json({ message: 'Withdrawal amount exceeds maximum limit' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.pin) {
      return res.status(400).json({ message: 'You must set a 4-digit PIN before making transactions.' });
    }
    const isPinValid = await user.comparePin(pin);
    if (!isPinValid) {
      return res.status(400).json({ message: 'Invalid PIN' });
    }

    // Check if user has sufficient balance
    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create transaction record
    const transaction = new Transaction({
      sender: userId,
      receiver: userId,
      amount,
      type: 'withdraw',
      status: 'completed',
      category: 'withdraw',
    });

    // Update balance
    user.balance -= amount;

    // Save all changes in a transaction
    await Promise.all([
      transaction.save(),
      user.save()
    ]);

    res.json({
      message: 'Withdrawal successful',
      transaction,
      newBalance: user.balance
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Withdrawal failed' });
  }
});

// Transfer funds
router.post('/transfer', auth, async (req, res) => {
  try {
    const { receiverAccountNumber, amount, pin } = req.body;
    const senderId = req.user._id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Prevent self-transfer
    if (receiverAccountNumber === req.user.accountNumber) {
      return res.status(400).json({ message: 'Cannot transfer to your own account' });
    }

    // Find receiver
    const receiver = await User.findOne({ accountNumber: receiverAccountNumber });
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver account not found' });
    }

    // Check if sender has sufficient balance
    const sender = await User.findById(senderId);
    if (sender.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    if (!sender.pin) {
      return res.status(400).json({ message: 'You must set a 4-digit PIN before making transactions.' });
    }
    const isPinValid = await sender.comparePin(pin);
    if (!isPinValid) {
      return res.status(400).json({ message: 'Invalid PIN' });
    }

    // Create transaction record
    const transaction = new Transaction({
      sender: senderId,
      receiver: receiver._id,
      amount,
      type: 'transfer',
      status: 'completed',
      category: 'transfer',
    });

    // Update balances
    sender.balance -= amount;
    receiver.balance += amount;

    // Save all changes in a transaction
    await Promise.all([
      transaction.save(),
      sender.save(),
      receiver.save()
    ]);

    res.json({
      message: 'Transfer successful',
      transaction,
      newBalance: sender.balance
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ message: 'Transfer failed' });
  }
});

// Get transaction history
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'firstName lastName accountNumber')
    .populate('receiver', 'firstName lastName accountNumber');

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

// Get user by account number
router.get('/by-account-number/:accountNumber', auth, async (req, res) => {
  try {
    const user = await User.findOne({ accountNumber: req.params.accountNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ userId: user._id, accountNumber: user.accountNumber, firstName: user.firstName, lastName: user.lastName });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user by account number', error: error.message });
  }
});

module.exports = router; 