const mongoose = require('mongoose');

// Middleware to validate MongoDB ObjectId
exports.validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};
