const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please add a task title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      required: true
    },
    dueDate: {
      type: Date,
      required: [true, 'Please add a due date']
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// Index for better query performance
taskSchema.index({ userId: 1, completed: 1 });
taskSchema.index({ dueDate: 1 });

// Virtual to check if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  return !this.completed && new Date() > this.dueDate;
});

// Virtual to check if task is due soon (within 24 hours)
taskSchema.virtual('isDueSoon').get(function() {
  if (this.completed) return false;
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
  return this.dueDate >= now && this.dueDate <= twentyFourHoursFromNow;
});

// Virtual to get time until due (in hours)
taskSchema.virtual('hoursUntilDue').get(function() {
  if (this.completed) return null;
  const now = new Date();
  const diffMs = this.dueDate - now;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  return diffHours;
});

// Ensure virtuals are included in JSON responses
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);
