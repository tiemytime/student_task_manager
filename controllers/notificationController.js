const Task = require('../models/Task');

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
    
    // Use aggregation pipeline for better performance
    const results = await Task.aggregate([
      {
        $match: {
          userId: userId,
          completed: false
        }
      },
      {
        $facet: {
          overdue: [
            { $match: { dueDate: { $lt: todayStart } } },
            { $sort: { dueDate: 1 } }
          ],
          dueToday: [
            { $match: { dueDate: { $gte: todayStart, $lte: todayEnd } } },
            { $sort: { dueDate: 1 } }
          ],
          dueTomorrow: [
            { $match: { dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd } } },
            { $sort: { dueDate: 1 } }
          ],
          upcoming: [
            { $match: { dueDate: { $gt: tomorrowEnd, $lte: threeDaysFromNow } } },
            { $sort: { dueDate: 1 } }
          ]
        }
      }
    ]);
    
    const data = results[0];
    const totalNotifications = data.overdue.length + data.dueToday.length + data.dueTomorrow.length;
    
    res.status(200).json({
      status: 'success',
      data: {
        overdue: {
          count: data.overdue.length,
          tasks: data.overdue
        },
        dueToday: {
          count: data.dueToday.length,
          tasks: data.dueToday
        },
        dueTomorrow: {
          count: data.dueTomorrow.length,
          tasks: data.dueTomorrow
        },
        upcoming: {
          count: data.upcoming.length,
          tasks: data.upcoming
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
    
    const overdueCount = await Task.countDocuments({
      userId,
      completed: false,
      dueDate: { $lt: now }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        overdueCount,
        hasOverdueTasks: overdueCount > 0
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
    
    const tasksDueSoon = await Task.find({
      userId,
      completed: false,
      dueDate: { $gte: now, $lte: futureTime }
    }).sort({ dueDate: 1 });
    
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
