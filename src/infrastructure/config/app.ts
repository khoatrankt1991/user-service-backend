import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: {
    uri: string;
    testUri: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  security: {
    bcryptRounds: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
  cors: {
    origin: string;
    credentials: boolean;
  };
  docs: {
    enabled: boolean;
    title: string;
    version: string;
    description: string;
  };
}

const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/user_service',
    testUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/user_service_test'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  security: {
    bcryptRounds: 12,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },
  
  docs: {
    enabled: process.env.API_DOCS_ENABLED === 'true',
    title: 'User Service API',
    version: '1.0.0',
    description: 'User Service Backend with Clean Architecture'
  }
};

// Validation for production
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

if (config.nodeEnv === 'production') {
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  });
}

export default config;
