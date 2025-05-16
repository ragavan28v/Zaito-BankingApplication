const express = require('express');
const router = express.Router();
const GroupExpense = require('../models/GroupExpense');
const PaymentRequest = require('../models/PaymentRequest');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');

// Create a new group expense
router.post('/expenses', auth, async (req, res) => {
  try {
    const { title, totalAmount, splitMethod, members, category } = req.body;
    const creatorId = req.user._id;

    // Validate members array
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'At least one member is required' });
    }

    // Mark creator's member entry as 'paid' if present
    const groupExpense = new GroupExpense({
      creator: creatorId,
      title,
      totalAmount,
      splitMethod,
      category,
      members: members.map(member => ({
        user: member.user,
        amount: member.amount,
        status: member.user.toString() === creatorId.toString() ? 'paid' : 'pending'
      }))
    });

    await groupExpense.save();

    // Create payment requests for each non-creator member
    const paymentRequests = await Promise.all(
      members.map(async (member) => {
        if (member.user.toString() === creatorId.toString()) return null; // Skip creator

        const paymentRequest = new PaymentRequest({
          sender: creatorId,
          receiver: member.user,
          amount: member.amount,
          note: `Payment for ${title}`,
          groupExpense: groupExpense._id
        });

        return paymentRequest.save();
      })
    );

    // Filter out null values (creator's payment request)
    const validPaymentRequests = paymentRequests.filter(req => req !== null);

    res.status(201).json({
      message: 'Group expense created successfully',
      groupExpense,
      paymentRequests: validPaymentRequests
    });
  } catch (error) {
    console.error('Create group expense error:', error);
    res.status(500).json({ message: 'Error creating group expense', error: error.message });
  }
});

// Get all group expenses for the current user
router.get('/expenses', auth, async (req, res) => {
  try {
    console.log('DEBUG: req.user:', req.user);
    const query = {
      $or: [
        { creator: req.user._id },
        { 'members.user': req.user._id }
      ]
    };
    console.log('DEBUG: GroupExpense query:', query);
    const groupExpenses = await GroupExpense.find(query)
      .sort({ createdAt: -1 })
      .populate('creator', 'firstName lastName accountNumber')
      .populate('members.user', 'firstName lastName accountNumber');
    console.log('DEBUG: groupExpenses result:', groupExpenses);
    res.json(groupExpenses);
  } catch (error) {
    console.error('DEBUG: Error fetching group expenses:', error);
    res.status(500).json({ message: 'Error fetching group expenses', error: error.message });
  }
});

// Get a specific group expense
router.get('/:expenseId', auth, async (req, res) => {
  try {
    const groupExpense = await GroupExpense.findById(req.params.expenseId)
      .populate('creator', 'firstName lastName accountNumber')
      .populate('members.user', 'firstName lastName accountNumber');

    if (!groupExpense) {
      return res.status(404).json({ message: 'Group expense not found' });
    }

    // Check if user is part of this group expense
    const isMember = groupExpense.creator._id.toString() === req.user._id.toString() ||
      groupExpense.members.some(member => member.user._id.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view this group expense' });
    }

    res.json(groupExpense);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group expense', error: error.message });
  }
});

// Update member payment status
router.put('/:expenseId/members/:memberId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const groupExpense = await GroupExpense.findById(req.params.expenseId);

    if (!groupExpense) {
      return res.status(404).json({ message: 'Group expense not found' });
    }

    // Check if user is the creator
    if (groupExpense.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can update member status' });
    }

    // Find and update member status
    const memberIndex = groupExpense.members.findIndex(
      member => member.user.toString() === req.params.memberId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found in this group expense' });
    }

    groupExpense.members[memberIndex].status = status;

    // Check if all members have paid
    const allPaid = groupExpense.members.every(member => member.status === 'paid');
    if (allPaid) {
      groupExpense.status = 'completed';
    }

    await groupExpense.save();

    res.json({
      message: 'Member status updated successfully',
      groupExpense
    });
  } catch (error) {
    console.error('Update member status error:', error);
    res.status(500).json({ message: 'Error updating member status', error: error.message });
  }
});

// Cancel a group expense
router.put('/:expenseId/cancel', auth, async (req, res) => {
  try {
    const groupExpense = await GroupExpense.findById(req.params.expenseId);

    if (!groupExpense) {
      return res.status(404).json({ message: 'Group expense not found' });
    }

    // Check if user is the creator
    if (groupExpense.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can cancel the group expense' });
    }

    if (groupExpense.status !== 'active') {
      return res.status(400).json({ message: 'Group expense is not active' });
    }

    // Cancel all pending payment requests
    await PaymentRequest.updateMany(
      { groupExpense: groupExpense._id, status: 'pending' },
      { status: 'declined' }
    );

    groupExpense.status = 'cancelled';
    await groupExpense.save();

    res.json({
      message: 'Group expense cancelled successfully',
      groupExpense
    });
  } catch (error) {
    console.error('Cancel group expense error:', error);
    res.status(500).json({ message: 'Error cancelling group expense', error: error.message });
  }
});

// Pay for a group expense
router.post('/expenses/:expenseId/pay', auth, async (req, res) => {
  try {
    const { pin, amount } = req.body;
    const userId = req.user._id;

    // Find the group expense
    const groupExpense = await GroupExpense.findById(req.params.expenseId);
    if (!groupExpense) {
      return res.status(404).json({ message: 'Group expense not found' });
    }

    // Check if user is a member
    const memberIndex = groupExpense.members.findIndex(
      member => member.user.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      return res.status(403).json({ message: 'You are not a member of this expense' });
    }

    // Check if already paid
    if (groupExpense.members[memberIndex].status === 'paid') {
      return res.status(400).json({ message: 'You have already paid for this expense' });
    }

    // Verify PIN
    const user = await User.findById(userId);
    if (!user.pin) {
      return res.status(400).json({ message: 'You must set a PIN before making payments' });
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
      receiver: groupExpense.creator,
      amount,
      type: 'group_expense',
      description: `Payment for group expense: ${groupExpense.title}`
    });

    // Update balances
    user.balance -= amount;
    const creator = await User.findById(groupExpense.creator);
    creator.balance += amount;

    // Update member status
    groupExpense.members[memberIndex].status = 'paid';

    // Check if all members have paid
    const allPaid = groupExpense.members.every(member => member.status === 'paid');
    if (allPaid) {
      groupExpense.status = 'completed';
    }

    // Save all changes
    await Promise.all([
      transaction.save(),
      user.save(),
      creator.save(),
      groupExpense.save()
    ]);

    res.json({
      message: 'Payment successful',
      transaction,
      groupExpense
    });
  } catch (error) {
    console.error('Pay group expense error:', error);
    res.status(500).json({ message: 'Error processing payment', error: error.message });
  }
});

// Settle a group expense (mark as completed if all members have paid)
router.post('/expenses/:expenseId/settle', auth, async (req, res) => {
  try {
    const groupExpense = await GroupExpense.findById(req.params.expenseId);
    if (!groupExpense) {
      return res.status(404).json({ message: 'Group expense not found' });
    }
    // Only the creator can settle the expense
    if (groupExpense.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can settle the group expense' });
    }
    // Only allow settling if all members have paid
    const allPaid = groupExpense.members.every(member => member.status === 'paid');
    if (!allPaid) {
      return res.status(400).json({ message: 'All members must pay before settling' });
    }
    groupExpense.status = 'completed';
    await groupExpense.save();
    res.json({
      message: 'Group expense settled successfully',
      groupExpense
    });
  } catch (error) {
    console.error('Settle group expense error:', error);
    res.status(500).json({ message: 'Error settling group expense', error: error.message });
  }
});

module.exports = router; 