import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import logger from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';

import { userRoutes } from "../routes/userRoutes.js";
import chatbotRoutes from "../routes/chatbotRoutes.js";
import liveActivityRoutes from "./routes/liveActivityRoutes.js";
import equipmentRoutes from "../routes/equipmentRoutes.js";
import venueRoutes from "../routes/venueRoutes.js";
import projectRoutes from "../routes/projectRoutes.js";
import studentInterestGroupRoutes from "../routes/studentInterestGroupRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { connectDB } from '../config/db.js';

// Create Express app
const app = express();
dotenv.config();



// MongoDB connection management for serverless environments
let isConnecting = false;
let connectionPromise = null;

const getConnection = async () => {
  // If already connected, return existing connection
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  
  // If currently connecting, wait for that connection
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }
  
  // Start new connection
  isConnecting = true;
  connectionPromise = connectDB()
    .then(connected => {
      if (connected) {
        console.log('✅ MongoDB connection established');
      } else {
        console.warn('⚠️ MongoDB connection failed');
      }
      isConnecting = false;
      return connected;
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      isConnecting = false;
      return false;
    });
  
  return connectionPromise;
};

// Lazy connection initialization - only connect when needed
const ensureConnection = async (req, res, next) => {
  try {
    await getConnection();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      message: 'Please try again later'
    });
  }
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : 
      [
        'http://localhost:3000',
        'https://atl-dashboard-one.vercel.app',
        'https://atl-dashboard-li48odu0l-candyyetszyus-projects.vercel.app',
        'https://*.vercel.app'
      ];
    
    if (!origin || allowedOrigins.includes(origin) || origin?.includes('vercel.app')) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Middleware
app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Health check endpoint optimized for serverless
app.get('/health', async (_req, res) => {
  try {
    // Quick database connectivity check without blocking
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        server: 'ok',
        database: dbStatus,
        deployment: 'serverless'
      },
      message: 'ATL Web Application is healthy and ready for serverless deployment',
      config: {
        mongoUri: process.env.MONGO_URI ? 'configured' : 'not configured',
        corsOrigins: process.env.CORS_ORIGINS ? 'configured' : 'default',
        jwtSecret: process.env.JWT_SECRET ? 'configured' : 'default'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      message: 'Health check failed'
    });
  }
});

// API Routes with connection middleware
app.use('/api', ensureConnection, userRoutes);
app.use('/api', ensureConnection, chatbotRoutes);
app.use('/api/live', ensureConnection, liveActivityRoutes);
app.use('/api', ensureConnection, equipmentRoutes);
app.use('/api', ensureConnection, venueRoutes);
app.use('/api', ensureConnection, projectRoutes);
app.use('/api', ensureConnection, studentInterestGroupRoutes);
app.use('/api/admin', ensureConnection, adminRoutes);

// Handle unmatched API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error handler optimized for serverless
app.use(function(err, req, res, _next) {
  console.error('Server error:', err);
  
  // Determine if we should expose error details
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // send error response
  res.status(err.status || 500);
  res.json({
    message: err.message || 'Internal server error',
    ...(isDevelopment && { 
      stack: err.stack,
      details: err
    }),
    timestamp: new Date().toISOString()
  });
});

// Serverless deployment configuration
export default app;

// Local development server (only runs in development)
if (process.env.NODE_ENV === 'development') {
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
        console.log(`🚀 Development server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
    });
    
    // Graceful shutdown for development
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        server.close(() => {
            console.log('Process terminated');
        });
    });
}

// Vercel serverless function handler
export const handler = app;