const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    const { firstName, lastName, email, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: 'All fields are required',
        missing: {
          firstName: !firstName,
          lastName: !lastName,
          email: !email,
          password: !password
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password
    });

    console.log('Attempting to save user:', { firstName, lastName, email });
    await user.save();
    console.log('User saved successfully:', user);

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountNumber: user.accountNumber,
        balance: user.balance,
        pin: user.pin
      }
    });
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Email already exists',
        error: 'Duplicate email address'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: error.message
      });
    }

    res.status(500).json({ 
      message: 'Error creating user',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountNumber: user.accountNumber,
        balance: user.balance,
        pin: user.pin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Update user details
router.put('/me', auth, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    await user.save();
    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      accountNumber: user.accountNumber,
      balance: user.balance
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Update/set PIN
router.put('/pin', auth, async (req, res) => {
  try {
    console.log('PIN update request:', { userId: req.user._id, hasOldPin: !!req.body.oldPin });
    const { pin, oldPin } = req.body;
    if (!/^[0-9]{4}$/.test(pin)) {
      return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.pin) {
      // If pin is already set, verify oldPin
      const isOldPinValid = await user.comparePin(oldPin);
      if (!isOldPinValid) {
        return res.status(400).json({ message: 'Current PIN is incorrect' });
      }
    }
    user.pin = pin;
    await user.save();
    
    // Return updated user data
    const updatedUser = await User.findById(user._id).select('-password');
    console.log('PIN updated successfully for user:', updatedUser._id);
    res.json({ 
      message: 'PIN updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('PIN update error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user._id
    });
    res.status(500).json({ message: 'Error updating PIN', error: error.message });
  }
});

// Initial PIN setup
router.put('/pin/setup', auth, async (req, res) => {
  try {
    console.log('PIN setup request:', { userId: req.user._id });
    const { pin } = req.body;
    if (!/^[0-9]{4}$/.test(pin)) {
      return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.pin) {
      return res.status(400).json({ message: 'PIN is already set. Use the update PIN endpoint to change it.' });
    }
    user.pin = pin;
    await user.save();
    
    // Return updated user data
    const updatedUser = await User.findById(user._id).select('-password');
    console.log('PIN setup successful for user:', updatedUser._id);
    res.json({ 
      message: 'PIN set successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('PIN setup error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user._id
    });
    res.status(500).json({ message: 'Error setting PIN', error: error.message });
  }
});

module.exports = router; 