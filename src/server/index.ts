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

// Security middleware
app.use(helmet());

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
    ? ['https://yourdomain.com'] // Replace with your production domain
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
    timestamp: new Date().toISOString()
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Dealer Management System API',
    docs: '/api',
    health: '/health'
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

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
      PORT: process.env.PORT
    });
    
    const usePostgres = process.env.USE_SQLITE !== 'true';
    console.log(`USE_SQLITE=${process.env.USE_SQLITE}, usePostgres=${usePostgres}`);
    
    await initializeDatabase(usePostgres);
    console.log(`Database initialized (${usePostgres ? 'PostgreSQL' : 'SQLite'})`);

    // Set up API routes after database is ready
    setupRoutes();

    // Serve static files from the React build (AFTER API routes)
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(process.cwd() + '/dist/client'));
      
      // Handle React routing, return all requests to React app
      app.get('*', (req, res) => {
        res.sendFile(process.cwd() + '/dist/client/index.html');
      });
    }

    // Seed sample data
    await seedSampleData(usePostgres);
    console.log('Sample data seeding completed');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base: http://localhost:${PORT}/api`);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🌐 Frontend dev server: http://localhost:3000`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
