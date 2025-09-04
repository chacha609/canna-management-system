const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { connectDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const plantRoutes = require('./routes/plants');
const batchRoutes = require('./routes/batches');
const strainRoutes = require('./routes/strains');
const roomRoutes = require('./routes/rooms');
const taskRoutes = require('./routes/tasks');
const inventoryRoutes = require('./routes/inventory');
const supplierRoutes = require('./routes/suppliers');
const categoryRoutes = require('./routes/categories');
const facilityRoutes = require('./routes/facilities');
const complianceRoutes = require('./routes/compliance');
const reportRoutes = require('./routes/reports');
const integrationRoutes = require('./routes/integrations');
const environmentalRoutes = require('./routes/environmental');
const tagRoutes = require('./routes/tags');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3002",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3002",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
const apiVersion = process.env.API_VERSION || 'v1';
app.use(`/api/${apiVersion}/auth`, authRoutes);
app.use(`/api/${apiVersion}/users`, userRoutes);
app.use(`/api/${apiVersion}/plants`, plantRoutes);
app.use(`/api/${apiVersion}/batches`, batchRoutes);
app.use(`/api/${apiVersion}/strains`, strainRoutes);
app.use(`/api/${apiVersion}/rooms`, roomRoutes);
app.use(`/api/${apiVersion}/tasks`, taskRoutes);
app.use(`/api/${apiVersion}/inventory`, inventoryRoutes);
app.use(`/api/${apiVersion}/suppliers`, supplierRoutes);
app.use(`/api/${apiVersion}/categories`, categoryRoutes);
app.use(`/api/${apiVersion}/facilities`, facilityRoutes);
app.use(`/api/${apiVersion}/compliance`, complianceRoutes);
app.use(`/api/${apiVersion}/reports`, reportRoutes);
app.use(`/api/${apiVersion}/integrations`, integrationRoutes);
app.use(`/api/${apiVersion}/environmental`, environmentalRoutes);
app.use(`/api/${apiVersion}/tags`, tagRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  
  // Join facility-specific rooms for real-time updates
  socket.on('join-facility', (facilityId) => {
    socket.join(`facility-${facilityId}`);
    logger.info(`Socket ${socket.id} joined facility-${facilityId}`);
  });

  // Handle environmental data updates
  socket.on('environmental-update', (data) => {
    socket.to(`facility-${data.facilityId}`).emit('environmental-data', data);
  });

  // Handle task updates
  socket.on('task-update', (data) => {
    socket.to(`facility-${data.facilityId}`).emit('task-updated', data);
  });

  // Handle plant status updates
  socket.on('plant-update', (data) => {
    socket.to(`facility-${data.facilityId}`).emit('plant-updated', data);
  });

  // Handle alerts
  socket.on('alert', (data) => {
    socket.to(`facility-${data.facilityId}`).emit('new-alert', data);
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Start server
    server.listen(PORT, () => {
      logger.info(`🌿 Cannabis Management System API running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API Version: ${apiVersion}`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`🚀 Server ready at http://localhost:${PORT}`);
        logger.info(`📡 Socket.IO ready for real-time connections`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };