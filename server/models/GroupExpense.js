const mongoose = require('mongoose');

const groupExpenseSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  splitMethod: {
    type: String,
    enum: ['equal', 'custom'],
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
    }
  }],
  category: {
    type: String,
    enum: ['food', 'travel', 'shopping', 'utilities', 'entertainment', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
groupExpenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validate that total amount matches sum of member amounts for equal split
groupExpenseSchema.pre('save', function(next) {
  if (this.splitMethod === 'equal') {
    const memberCount = this.members.length;
    const expectedAmount = this.totalAmount / memberCount;
    const isValid = this.members.every(member => member.amount === expectedAmount);
    if (!isValid) {
      next(new Error('Equal split amounts do not match total'));
    }
  }
  next();
});

const GroupExpense = mongoose.model('GroupExpense', groupExpenseSchema);

module.exports = GroupExpense; 