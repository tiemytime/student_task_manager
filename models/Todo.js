const mongoose = require('mongoose');

/**
 * Todo Schema for Daily Planner
 */
const todoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      default: '',
      maxlength: 500,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
todoSchema.index({ user: 1, order: 1 });

module.exports = mongoose.model('Todo', todoSchema);
