const Transaction = require('../models/Transaction');
const moment = require('moment');

// Helper to get date range
function getDateRange(timeRange) {
  const end = moment().endOf('day');
  let start;
  if (timeRange === 'week') start = moment().subtract(6, 'days').startOf('day');
  else if (timeRange === 'month') start = moment().subtract(1, 'month').startOf('day');
  else if (timeRange === 'year') start = moment().subtract(1, 'year').startOf('day');
  else start = moment().subtract(1, 'month').startOf('day');
  return { start: start.toDate(), end: end.toDate() };
}

exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const timeRange = req.query.timeRange || 'month';
    const { start, end } = getDateRange(timeRange);

    // Get all completed transactions for this user in range
    const transactions = await Transaction.find({
      $or: [ { sender: userId }, { receiver: userId } ],
      status: 'completed',
      createdAt: { $gte: start, $lte: end }
    }).lean();

    // Spending by category (expenses only)
    const spendingByCategory = {};
    transactions.forEach(tx => {
      if (String(tx.sender) === String(userId)) {
        const cat = tx.category || 'other';
        spendingByCategory[cat] = (spendingByCategory[cat] || 0) + tx.amount;
      }
    });
    const spendingByCategoryArr = Object.entries(spendingByCategory).map(([category, amount]) => ({ category, amount }));

    // Spending trend (group by day)
    const trendMap = {};
    transactions.forEach(tx => {
      if (String(tx.sender) === String(userId)) {
        const date = moment(tx.createdAt).format('YYYY-MM-DD');
        trendMap[date] = (trendMap[date] || 0) + tx.amount;
      }
    });
    const spendingTrend = Object.entries(trendMap).sort().map(([date, amount]) => ({ date, amount }));

    // Top expenses (largest outgoing transactions)
    const topExpenses = transactions
      .filter(tx => String(tx.sender) === String(userId))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(tx => ({
        description: tx.note || tx.category || 'Expense',
        amount: tx.amount,
        date: moment(tx.createdAt).format('YYYY-MM-DD')
      }));

    // Summary
    const outgoing = transactions.filter(tx => String(tx.sender) === String(userId));
    const incoming = transactions.filter(tx => String(tx.receiver) === String(userId));
    const totalSpent = outgoing.reduce((sum, tx) => sum + tx.amount, 0);
    const totalReceived = incoming.reduce((sum, tx) => sum + tx.amount, 0);
    const totalTransactions = transactions.length;
    const averageTransaction = totalTransactions ? (totalSpent / outgoing.length) : 0;
    const savingsRate = totalReceived ? (100 * (totalReceived - totalSpent) / totalReceived) : 0;

    res.json({
      spendingByCategory: spendingByCategoryArr,
      spendingTrend,
      topExpenses,
      summary: {
        totalSpent,
        averageTransaction,
        totalTransactions,
        savingsRate
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Error generating analytics', error: err.message });
  }
}; 