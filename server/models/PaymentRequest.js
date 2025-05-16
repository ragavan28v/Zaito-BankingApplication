const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  note: {
    type: String,
    trim: true,
    maxlength: 200
  },
  groupExpense: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupExpense',
    default: null
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
paymentRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const PaymentRequest = mongoose.model('PaymentRequest', paymentRequestSchema);

module.exports = PaymentRequest; 