const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const analyticsController = require('../controllers/analyticsController');

// Add note to transaction
router.put('/:transactionId/note', auth, async (req, res) => {
  try {
    const { note } = req.body;
    const transaction = await Transaction.findById(req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user is part of this transaction
    if (transaction.sender.toString() !== req.user._id.toString() && 
        transaction.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this transaction' });
    }

    transaction.note = note;
    await transaction.save();

    res.json({
      message: 'Note added successfully',
      transaction
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: 'Error adding note', error: error.message });
  }
});

// Get mini-statement
router.get('/statement', auth, async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;
    const userId = req.user._id;

    // Build query
    const query = {
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      status: 'completed'
    };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get transactions
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .populate('sender', 'firstName lastName accountNumber')
      .populate('receiver', 'firstName lastName accountNumber');

    // Calculate summary
    const summary = {
      totalDebits: 0,
      totalCredits: 0,
      balance: 0
    };

    transactions.forEach(transaction => {
      if (transaction.sender._id.toString() === userId.toString()) {
        summary.totalDebits += transaction.amount;
        summary.balance -= transaction.amount;
      } else {
        summary.totalCredits += transaction.amount;
        summary.balance += transaction.amount;
      }
    });

    // If PDF format requested
    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=statement.pdf');
      doc.pipe(res);

      // Add header
      doc.fontSize(20).text('Mini Statement', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${moment().format('MMMM Do YYYY, h:mm:ss a')}`);
      doc.moveDown();

      // Add summary
      doc.fontSize(14).text('Summary');
      doc.fontSize(12).text(`Total Debits: $${summary.totalDebits.toFixed(2)}`);
      doc.text(`Total Credits: $${summary.totalCredits.toFixed(2)}`);
      doc.text(`Net Balance: $${summary.balance.toFixed(2)}`);
      doc.moveDown();

      // Add transactions
      doc.fontSize(14).text('Transactions');
      doc.moveDown();

      transactions.forEach(transaction => {
        const date = moment(transaction.createdAt).format('MMM DD, YYYY');
        const amount = transaction.amount.toFixed(2);
        const type = transaction.sender._id.toString() === userId.toString() ? 'Debit' : 'Credit';
        const account = type === 'Debit' ? 
          transaction.receiver.accountNumber : 
          transaction.sender.accountNumber;

        doc.fontSize(10)
          .text(`${date} - ${type} - $${amount} - Account: ${account}`);
        
        if (transaction.note) {
          doc.fontSize(8).text(`Note: ${transaction.note}`);
        }
        doc.moveDown();
      });

      doc.end();
    } else {
      // Return JSON response
      res.json({
        transactions,
        summary
      });
    }
  } catch (error) {
    console.error('Get statement error:', error);
    res.status(500).json({ message: 'Error generating statement', error: error.message });
  }
});

// Get transaction categories summary
router.get('/categories', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    // Build query
    const query = {
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      status: 'completed'
    };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get transactions and group by category
    const transactions = await Transaction.find(query);
    
    const categorySummary = transactions.reduce((acc, transaction) => {
      const category = transaction.category || 'other';
      const amount = transaction.amount;
      
      if (!acc[category]) {
        acc[category] = {
          total: 0,
          count: 0
        };
      }

      acc[category].total += amount;
      acc[category].count += 1;

      return acc;
    }, {});

    res.json(categorySummary);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Error getting category summary', error: error.message });
  }
});

// Analytics endpoint
router.get('/analytics', auth, analyticsController.getAnalytics);

module.exports = router; 