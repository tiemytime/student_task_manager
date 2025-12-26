const Todo = require('../models/Todo');

/**
 * Get all todos for the authenticated user
 * @route GET /api/todos
 */
exports.getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user._id })
      .sort({ order: 1, createdAt: 1 })
      .select('-__v');

    // If no todos exist, create default 6 empty todos
    if (todos.length === 0) {
      const defaultTodos = [];
      for (let i = 0; i < 6; i++) {
        defaultTodos.push({
          user: req.user._id,
          text: '',
          completed: false,
          order: i,
        });
      }
      const createdTodos = await Todo.insertMany(defaultTodos);
      return res.status(200).json({
        status: 'success',
        results: createdTodos.length,
        data: createdTodos,
      });
    }

    res.status(200).json({
      status: 'success',
      results: todos.length,
      data: todos,
    });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch todos',
    });
  }
};

/**
 * Update a todo
 * @route PATCH /api/todos/:id
 */
exports.updateTodo = async (req, res) => {
  try {
    const { text, completed, order } = req.body;
    
    // Find todo and verify ownership
    const todo = await Todo.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!todo) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found',
      });
    }

    // Update fields
    if (text !== undefined) todo.text = text;
    if (completed !== undefined) todo.completed = completed;
    if (order !== undefined) todo.order = order;

    await todo.save();

    res.status(200).json({
      status: 'success',
      data: todo,
    });
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update todo',
    });
  }
};

/**
 * Create a new todo
 * @route POST /api/todos
 */
exports.createTodo = async (req, res) => {
  try {
    const { text = '', completed = false, order } = req.body;

    // Get the max order if not provided
    let todoOrder = order;
    if (todoOrder === undefined) {
      const lastTodo = await Todo.findOne({ user: req.user._id })
        .sort({ order: -1 });
      todoOrder = lastTodo ? lastTodo.order + 1 : 0;
    }

    const todo = await Todo.create({
      user: req.user._id,
      text,
      completed,
      order: todoOrder,
    });

    res.status(201).json({
      status: 'success',
      data: todo,
    });
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create todo',
    });
  }
};

/**
 * Delete a todo
 * @route DELETE /api/todos/:id
 */
exports.deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!todo) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Todo deleted successfully',
    });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete todo',
    });
  }
};

/**
 * Bulk update todos (for reordering)
 * @route PATCH /api/todos/bulk
 */
exports.bulkUpdateTodos = async (req, res) => {
  try {
    const { todos } = req.body;

    if (!Array.isArray(todos)) {
      return res.status(400).json({
        status: 'error',
        message: 'Todos must be an array',
      });
    }

    // Update all todos
    const updatePromises = todos.map(({ _id, text, completed, order }) => {
      return Todo.findOneAndUpdate(
        { _id, user: req.user._id },
        { text, completed, order },
        { new: true }
      );
    });

    const updatedTodos = await Promise.all(updatePromises);

    res.status(200).json({
      status: 'success',
      data: updatedTodos.filter(Boolean), // Filter out null results
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update todos',
    });
  }
};
