const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ _id: decoded.userId });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = auth; 