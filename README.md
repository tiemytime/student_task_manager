# Student Task Manager - Backend API

REST API for task management with user authentication and daily todos.

## 🌐 Live API

**Base URL:** https://student-task-manager-3.onrender.com  
**Health Check:** https://student-task-manager-3.onrender.com/api/health

## 🛠 Tech Stack

Node.js, Express, MongoDB, JWT, bcrypt

## ⚡ Quick Start

### Prerequisites

- Node.js v18+
- MongoDB connection string

### Installation

1. **Clone and navigate**

   ```bash
   git clone <your-repo-url>
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   Create `.env` file:

   ```bash
   PORT=5000
   NODE_ENV=development
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_key_min_32_chars
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   ```

4. **Run the server**

   ```bash
   npm run dev    # Development (with nodemon)
   npm start      # Production
   ```

   Server runs on http://localhost:5000

## 📡 API Endpoints

### Auth

```
POST   /api/auth/signup    # Create account
POST   /api/auth/login     # Login
GET    /api/auth/me        # Get user info
```

### Tasks

```
GET    /api/tasks          # Get all tasks
POST   /api/tasks          # Create task
PATCH  /api/tasks/:id      # Update task
DELETE /api/tasks/:id      # Delete task
```

### Todos

```
GET    /api/todos          # Get all todos
POST   /api/todos          # Create todo
PATCH  /api/todos/:id      # Update todo
DELETE /api/todos/:id      # Delete todo
```

All routes (except signup/login) require JWT token in header:

```
Authorization: Bearer <token>
```

## 📁 Structure

```
├── config/        # DB connection, env validation
├── controllers/   # Route logic
├── middleware/    # Auth, validation, rate limiting
├── models/        # MongoDB schemas
├── routes/        # API routes
└── server.js      # Entry point
```

## 🔒 Security

- Bcrypt password hashing
- JWT authentication
- Rate limiting
- Input validation
- CORS configured
- MongoDB injection protection
