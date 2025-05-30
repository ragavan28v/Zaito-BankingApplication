const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['deposit', 'withdraw', 'transfer'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  note: {
    type: String,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    default: 'other'
  },
  paymentRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentRequest',
    default: null
  },
  groupExpense: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupExpense',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 