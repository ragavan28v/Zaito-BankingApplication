const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const analyticsController = require('../controllers/analyticsController');

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