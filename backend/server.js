const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

// Set default environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Log environment variables (excluding sensitive data)
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);
console.log('MongoDB URI:', process.env.MONGO_URI ? 'Configured' : 'Not configured');

// Connect to database
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

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
  const notificationRoutes = require('./routes/notification.routes');

  // Mount routes
  app.use('/api/auth', authRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/loans', loanRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/notifications', notificationRoutes);
} catch (error) {
  console.error('Error loading routes:', error);
  process.exit(1);
}

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`MongoDB URI: ${process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sacco_db'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
}); 