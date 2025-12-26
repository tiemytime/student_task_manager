const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validateId');
const {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  bulkUpdateTodos,
} = require('../controllers/todoController');

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
  .get(getTodos)
  .post(createTodo);

router.patch('/bulk', bulkUpdateTodos);

router.route('/:id')
  .patch(validateObjectId, updateTodo)
  .delete(validateObjectId, deleteTodo);

module.exports = router;
