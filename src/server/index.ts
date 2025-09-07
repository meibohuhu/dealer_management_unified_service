import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import route factories
import { createContractsRouter } from './routes/contracts';
import { createVehiclesRouter } from './routes/vehicles';
import { createCustomersRouter } from './routes/customers';
import { createContractFilesRouter } from './routes/contract-files';

// Import configuration
import { config } from './config/config';
import { initSqlite, closeSqlite } from './config/database';
import { initializeDatabase } from './config/init-db';
import { seedSampleData } from './config/seed-data';

// Load environment variables
dotenv.config();

// Note: __dirname and __filename are not available in ES modules
// We'll use process.cwd() instead for the uploads directory

const app = express();
const PORT = config.server.port || 8080;

// Trust proxy for rate limiting behind load balancers
app.set('trust proxy', 1);

// Security middleware with CSP configuration for DigitalOcean Spaces
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'", 
        "https://sfo3.digitaloceanspaces.com",
        "https://*.digitaloceanspaces.com",
        "https://dealer-management-files.sfo3.digitaloceanspaces.com",
        "https://dealer-management-files.sfo3.cdn.digitaloceanspaces.com"
      ],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
}));

// Rate limiting (only in production)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/api/', limiter);
}

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://dealer-management-system-djlol.ondigitalocean.app'] // DigitalOcean app domain
    : ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes will be set up after database initialization

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'dealer-management-system',
    version: config.app.version,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    useSqlite: process.env.USE_SQLITE
  });
});

// Seed data endpoint (for development/testing)
app.post('/seed-data', async (req, res) => {
  try {
    const usePostgres = process.env.USE_SQLITE !== 'true';
    await seedSampleData(usePostgres);
    res.json({ message: 'Sample data seeded successfully' });
  } catch (error) {
    console.error('Error seeding data:', error);
    res.status(500).json({ error: 'Failed to seed data' });
  }
});

// Test DigitalOcean Spaces connection
app.get('/test-spaces', (req, res) => {
  const spacesConfig = {
    endpoint: process.env.VITE_SPACES_ENDPOINT,
    bucket: process.env.VITE_SPACES_BUCKET,
    region: process.env.VITE_SPACES_REGION,
    accessKeyId: process.env.VITE_SPACES_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
    secretAccessKey: process.env.VITE_SPACES_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
    cdnEndpoint: process.env.VITE_SPACES_CDN_ENDPOINT
  };
  
  res.json({
    message: 'DigitalOcean Spaces Configuration',
    config: spacesConfig,
    isConfigured: !!(spacesConfig.endpoint && spacesConfig.bucket && spacesConfig.accessKeyId && spacesConfig.secretAccessKey)
  });
});

// Debug endpoint to check production build files
app.get('/debug-build', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const distPath = path.join(process.cwd(), 'dist');
    const clientPath = path.join(distPath, 'client');
    
    const distExists = fs.existsSync(distPath);
    const clientExists = fs.existsSync(clientPath);
    const indexExists = fs.existsSync(path.join(clientPath, 'index.html'));
    
    let clientFiles = [];
    if (clientExists) {
      clientFiles = fs.readdirSync(clientPath);
    }
    
    res.json({
      message: 'Build Debug Information',
      distExists,
      clientExists,
      indexExists,
      clientFiles,
      cwd: process.cwd(),
      distPath,
      clientPath
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: 'Failed to check build files',
      message: errorMessage
    });
  }
});

// Database migration endpoint (for development/testing)
app.post('/migrate-db', async (req, res) => {
  try {
    const usePostgres = process.env.USE_SQLITE !== 'true';
    if (usePostgres) {
      const client = await (await import('./config/database')).pgPool.connect();
      try {
        // Add missing columns to existing tables
        await client.query('ALTER TABLE ds_vehicle ADD COLUMN IF NOT EXISTS mileage INTEGER DEFAULT 0');
        await client.query('ALTER TABLE ds_vehicle ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0');
        await client.query('ALTER TABLE ds_vehicle ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'available\'');
        await client.query('ALTER TABLE ds_vehicle ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        
        // Add missing columns to customer table
        await client.query('ALTER TABLE ds_customer ADD COLUMN IF NOT EXISTS address TEXT');
        await client.query('ALTER TABLE ds_customer ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        
        res.json({ message: 'Database migration completed successfully' });
      } finally {
        client.release();
      }
    } else {
      res.json({ message: 'Migration not needed for SQLite' });
    }
  } catch (error) {
    console.error('Error during database migration:', error);
    res.status(500).json({ error: 'Database migration failed' });
  }
});

// Root endpoint - REMOVED to allow React app to be served
// The static file serving will handle the root route and serve the React app

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler - MOVED to end of route registration

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await closeSqlite();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await closeSqlite();
  process.exit(0);
});

// Function to set up API routes after database initialization
const setupRoutes = () => {
  app.use('/api/contracts', createContractsRouter());
  app.use('/api/vehicles', createVehiclesRouter());
  app.use('/api/customers', createCustomersRouter());
  app.use('/api/contract-files', createContractFilesRouter());
};

// Start server
const startServer = async () => {
  try {
    // Initialize database
    console.log('Environment variables:', {
      USE_SQLITE: process.env.USE_SQLITE,
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
    });
    
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL;
      const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
      console.log(`Database URL: ${maskedUrl}`);
    }
    
    const usePostgres = process.env.USE_SQLITE !== 'true';
    console.log(`USE_SQLITE=${process.env.USE_SQLITE}, usePostgres=${usePostgres}`);
    
    try {
      await initializeDatabase(usePostgres);
      console.log(`Database initialized (${usePostgres ? 'PostgreSQL' : 'SQLite'})`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to initialize database:', errorMessage);
      throw new Error(`Database initialization failed: ${errorMessage}`);
    }

    // Serve static files from the React build (BEFORE API routes)
    console.log(`NODE_ENV check: ${process.env.NODE_ENV}`);
    console.log(`NODE_ENV === 'production': ${process.env.NODE_ENV === 'production'}`);
    
    if (process.env.NODE_ENV === 'production') {
      const staticPath = process.cwd() + '/dist/client';
      console.log(`Serving static files from: ${staticPath}`);
      
      // Check if the directory exists
      const fs = require('fs');
      const distExists = fs.existsSync(process.cwd() + '/dist');
      const clientExists = fs.existsSync(staticPath);
      console.log(`dist directory exists: ${distExists}`);
      console.log(`dist/client directory exists: ${clientExists}`);
      
      if (clientExists) {
        // Serve static files FIRST
        app.use(express.static(staticPath));
        console.log('Static file middleware registered successfully');
      } else {
        console.log('ERROR: dist/client directory does not exist! Build may have failed.');
        console.log('Available directories:', fs.readdirSync(process.cwd()));
      }
    } else {
      console.log('Not in production mode, skipping static file serving');
    }

    // Set up API routes AFTER static file serving
    setupRoutes();

    // No catch-all route needed - express.static() will handle all non-API routes
    // The static file serving will automatically serve index.html for any route that doesn't match an API route

    // 404 handler - MUST come AFTER all other routes
    app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Seed sample data
    await seedSampleData(usePostgres);
    console.log('Sample data seeding completed');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base: http://localhost:${PORT}/api`);
      console.log(`🔍 Debug build info: http://localhost:${PORT}/debug-build`);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🌐 Frontend dev server: http://localhost:3000`);
      } else {
        console.log(`🏗️ Production mode - serving static files from dist/client`);
        console.log(`📁 Current working directory: ${process.cwd()}`);
        console.log(`📁 Static files path: ${process.cwd()}/dist/client`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
