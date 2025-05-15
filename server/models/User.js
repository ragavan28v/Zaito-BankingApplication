const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  accountNumber: {
    type: String,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },
  pin: {
    type: String,
    required: false, // Must be set before first transaction
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate account number before saving
userSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      // Generate a random 6-digit number
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      this.accountNumber = `ACC${randomNum}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Hash pin before saving if modified
userSchema.pre('save', async function(next) {
  try {
    if (this.isModified('pin') && this.pin) {
      const salt = await bcrypt.genSalt(10);
      this.pin = await bcrypt.hash(this.pin, salt);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Method to compare pin
userSchema.methods.comparePin = async function(candidatePin) {
  try {
    return await bcrypt.compare(candidatePin, this.pin);
  } catch (error) {
    throw new Error('Error comparing PIN');
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 