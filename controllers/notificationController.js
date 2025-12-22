const Task = require('../models/Task');

// Helper function to get full due datetime
const getFullDueDateTime = (task) => {
  const dueDateTime = new Date(task.dueDate);
  
  if (task.dueTime) {
    const [hours, minutes] = task.dueTime.split(':');
    dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  } else {
    dueDateTime.setHours(23, 59, 59, 999);
  }
  
  return dueDateTime;
};

// @desc    Get tasks that need notification (overdue or due soon)
// @route   GET /api/tasks/notifications
// @access  Private
exports.getTaskNotifications = async (req, res, next) => {
  try {
    const now = new Date();
    const userId = req.user._id;
    
    // Define date ranges
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);
    
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    // Get all incomplete tasks
    const allTasks = await Task.find({
      userId,
      completed: false
    }).lean();
    
    // Categorize with time-aware logic
    const categories = {
      overdue: [],
      dueToday: [],
      dueTomorrow: [],
      upcoming: []
    };
    
    allTasks.forEach(task => {
      const dueDateTime = getFullDueDateTime(task);
      const taskWithDateTime = {
        ...task,
        fullDueDateTime: dueDateTime,
        minutesUntilDue: Math.floor((dueDateTime - now) / (1000 * 60))
      };
      
      if (dueDateTime < now) {
        categories.overdue.push(taskWithDateTime);
      } else if (dueDateTime >= todayStart && dueDateTime <= todayEnd) {
        categories.dueToday.push(taskWithDateTime);
      } else if (dueDateTime >= tomorrowStart && dueDateTime <= tomorrowEnd) {
        categories.dueTomorrow.push(taskWithDateTime);
      } else if (dueDateTime <= threeDaysFromNow) {
        categories.upcoming.push(taskWithDateTime);
      }
    });
    
    // Sort by due datetime
    Object.keys(categories).forEach(key => {
      categories[key].sort((a, b) => a.fullDueDateTime - b.fullDueDateTime);
    });
    
    const totalNotifications = categories.overdue.length + 
                               categories.dueToday.length + 
                               categories.dueTomorrow.length;
    
    res.status(200).json({
      status: 'success',
      data: {
        overdue: {
          count: categories.overdue.length,
          tasks: categories.overdue
        },
        dueToday: {
          count: categories.dueToday.length,
          tasks: categories.dueToday
        },
        dueTomorrow: {
          count: categories.dueTomorrow.length,
          tasks: categories.dueTomorrow
        },
        upcoming: {
          count: categories.upcoming.length,
          tasks: categories.upcoming
        },
        totalNotifications
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overdue tasks count
// @route   GET /api/tasks/overdue-count
// @access  Private
exports.getOverdueCount = async (req, res, next) => {
  try {
    const now = new Date();
    const userId = req.user._id;
    
    // Get all incomplete tasks
    const tasks = await Task.find({
      userId,
      completed: false
    }).lean();
    
    // Count overdue tasks with time consideration
    const overdueTasks = tasks.filter(task => {
      const dueDateTime = getFullDueDateTime(task);
      return dueDateTime < now;
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        overdueCount: overdueTasks.length,
        hasOverdueTasks: overdueTasks.length > 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks due within specified hours
// @route   GET /api/tasks/due-soon?hours=24
// @access  Private
exports.getTasksDueSoon = async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const now = new Date();
    const futureTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    
    const userId = req.user._id;
    
    // Get all incomplete tasks
    const allTasks = await Task.find({
      userId,
      completed: false
    }).lean();
    
    // Filter with time-aware logic
    const tasksDueSoon = allTasks
      .map(task => {
        const dueDateTime = getFullDueDateTime(task);
        return {
          ...task,
          fullDueDateTime: dueDateTime,
          minutesUntilDue: Math.floor((dueDateTime - now) / (1000 * 60))
        };
      })
      .filter(task => task.fullDueDateTime >= now && task.fullDueDateTime <= futureTime)
      .sort((a, b) => a.fullDueDateTime - b.fullDueDateTime);
    
    res.status(200).json({
      status: 'success',
      data: {
        hours,
        count: tasksDueSoon.length,
        tasks: tasksDueSoon
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get urgent notifications (tasks due within 1 hour or 30 min)
// @route   GET /api/tasks/notifications/urgent
// @access  Private
exports.getUrgentNotifications = async (req, res, next) => {
  try {
    const now = new Date();
    const userId = req.user._id;
    
    // Get all incomplete tasks
    const tasks = await Task.find({
      userId,
      completed: false
    }).lean();
    
    // Filter tasks with time-aware logic
    const urgentTasks = {
      within30Min: [],
      within1Hour: []
    };
    
    tasks.forEach(task => {
      const dueDateTime = getFullDueDateTime(task);
      const diffMinutes = Math.floor((dueDateTime - now) / (1000 * 60));
      
      // Only include tasks that are upcoming (not overdue)
      if (diffMinutes > 0 && diffMinutes <= 60) {
        const taskWithTime = {
          ...task,
          fullDueDateTime: dueDateTime,
          minutesUntilDue: diffMinutes
        };
        
        if (diffMinutes <= 30) {
          urgentTasks.within30Min.push(taskWithTime);
        } else {
          urgentTasks.within1Hour.push(taskWithTime);
        }
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        within30Min: {
          count: urgentTasks.within30Min.length,
          tasks: urgentTasks.within30Min
        },
        within1Hour: {
          count: urgentTasks.within1Hour.length,
          tasks: urgentTasks.within1Hour
        },
        totalUrgent: urgentTasks.within30Min.length + urgentTasks.within1Hour.length,
        message: urgentTasks.within30Min.length > 0 
          ? '🚨 You have tasks due very soon!' 
          : urgentTasks.within1Hour.length > 0 
            ? '⚠️ You have tasks due within the hour'
            : '✅ No urgent tasks'
      }
    });
  } catch (error) {
    next(error);
  }
};
