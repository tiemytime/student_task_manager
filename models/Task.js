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
    dueTime: {
      type: String,
      trim: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format (24-hour)']
      // Optional field - if not provided, task is due end of day
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

// Helper method to get full due datetime
taskSchema.methods.getFullDueDateTime = function() {
  const dueDateTime = new Date(this.dueDate);
  
  if (this.dueTime) {
    // If time is specified, use it
    const [hours, minutes] = this.dueTime.split(':');
    dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  } else {
    // If no time, default to end of day
    dueDateTime.setHours(23, 59, 59, 999);
  }
  
  return dueDateTime;
};

// Virtual to check if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (this.completed) return false;
  const now = new Date();
  const dueDateTime = this.getFullDueDateTime();
  return now > dueDateTime;
});

// Virtual to check if task is due soon (within 24 hours)
taskSchema.virtual('isDueSoon').get(function() {
  if (this.completed) return false;
  const now = new Date();
  const dueDateTime = this.getFullDueDateTime();
  const twentyFourHoursFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
  return dueDateTime >= now && dueDateTime <= twentyFourHoursFromNow;
});

// Virtual to check if task needs urgent notification (within 1 hour)
taskSchema.virtual('isUrgent').get(function() {
  if (this.completed || !this.dueTime) return false;
  const now = new Date();
  const dueDateTime = this.getFullDueDateTime();
  const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000));
  return dueDateTime >= now && dueDateTime <= oneHourFromNow;
});

// Virtual to get time until due (in minutes for precision)
taskSchema.virtual('minutesUntilDue').get(function() {
  if (this.completed) return null;
  const now = new Date();
  const dueDateTime = this.getFullDueDateTime();
  const diffMs = dueDateTime - now;
  return Math.floor(diffMs / (1000 * 60));
});

// Virtual to get time until due (in hours)
taskSchema.virtual('hoursUntilDue').get(function() {
  if (this.completed) return null;
  const minutes = this.minutesUntilDue;
  return minutes !== null ? Math.floor(minutes / 60) : null;
});

// Ensure virtuals are included in JSON responses
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);
