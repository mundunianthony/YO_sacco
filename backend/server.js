const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Set default environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Log environment variables (excluding sensitive data)
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Configured' : 'Not configured');

// Connect to database
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'SACCO API is running' });
});

// Import routes
try {
  const authRoutes = require('./routes/auth.routes');
  const memberRoutes = require('./routes/member.routes');
  const adminRoutes = require('./routes/admin.routes');
  const loanRoutes = require('./routes/loan.routes');
  const transactionRoutes = require('./routes/transaction.routes');
  const messageRoutes = require('./routes/message.routes');

  // Mount routes
  app.use('/api/auth', authRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/loans', loanRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/messages', messageRoutes);
} catch (error) {
  console.error('Error loading routes:', error);
  process.exit(1);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

// Start server
try {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sacco_db'}`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
} 