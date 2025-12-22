const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

const {
  getTaskNotifications,
  getOverdueCount,
  getTasksDueSoon
} = require('../controllers/notificationController');

const { protect } = require('../middleware/auth');
const { createTaskLimiter } = require('../middleware/rateLimiter');
const { validateObjectId } = require('../middleware/validateId');
const { 
  createTaskValidation, 
  updateTaskValidation, 
  validate 
} = require('../middleware/validation');

// Apply auth middleware to all routes
router.use(protect);

// Notification routes (place before /:id to avoid conflicts)
router.get('/notifications', getTaskNotifications);
router.get('/overdue-count', getOverdueCount);
router.get('/due-soon', getTasksDueSoon);

router.route('/')
  .get(getTasks)
  .post(createTaskLimiter, createTaskValidation, validate, createTask);

router.route('/:id')
  .get(validateObjectId(), getTask)
  .put(validateObjectId(), updateTaskValidation, validate, updateTask)
  .delete(validateObjectId(), deleteTask);

module.exports = router;
