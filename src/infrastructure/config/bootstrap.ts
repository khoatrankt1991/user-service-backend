import { databaseConfig } from './database';
import { container } from './container';
import config from './app';

export interface BootstrapResult {
  success: boolean;
  message: string;
  details?: {
    database: { connected: boolean; uri: string };
    container: { initialized: boolean };
    config: { loaded: boolean; environment: string };
  };
}

export class ApplicationBootstrap {
  private isInitialized = false;

  public async initialize(): Promise<BootstrapResult> {
    try {
      console.log('🚀 Starting application bootstrap...');

      // Validate configuration
      this.validateConfiguration();
      console.log('✅ Configuration validated');

      // Initialize database connection
      await this.initializeDatabase();
      console.log('✅ Database connected');

      // Initialize dependency injection container
      this.initializeContainer();
      console.log('✅ Dependency injection container initialized');

      // Verify system health
      await this.verifySystemHealth();
      console.log('✅ System health verified');

      this.isInitialized = true;

      return {
        success: true,
        message: 'Application bootstrap completed successfully',
        details: {
          database: {
            connected: databaseConfig.isConnected(),
            uri: this.sanitizeUri(config.database.uri)
          },
          container: {
            initialized: true
          },
          config: {
            loaded: true,
            environment: config.nodeEnv
          }
        }
      };
    } catch (error: any) {
      console.error('❌ Bootstrap failed:', error.message);
      return {
        success: false,
        message: `Bootstrap failed: ${error.message}`
      };
    }
  }

  private validateConfiguration(): void {
    const requiredConfigs = [
      { key: 'PORT', value: config.port },
      { key: 'NODE_ENV', value: config.nodeEnv },
      { key: 'MONGODB_URI', value: config.database.uri },
      { key: 'JWT_SECRET', value: config.jwt.secret }
    ];

    const missingConfigs = requiredConfigs.filter(cfg => !cfg.value);
    
    if (missingConfigs.length > 0) {
      const missing = missingConfigs.map(cfg => cfg.key).join(', ');
      throw new Error(`Missing required configuration: ${missing}`);
    }

    // Validate JWT secret in production
    if (config.nodeEnv === 'production' && config.jwt.secret === 'fallback-secret-key') {
      throw new Error('Production requires a secure JWT_SECRET');
    }

    // Validate database URI format
    if (!config.database.uri.startsWith('mongodb://') && !config.database.uri.startsWith('mongodb+srv://')) {
      throw new Error('Invalid MongoDB URI format');
    }
  }

  private async initializeDatabase(): Promise<void> {
    const dbUri = config.nodeEnv === 'test' ? config.database.testUri : config.database.uri;
    await databaseConfig.connect(dbUri);
  }

  private initializeContainer(): void {
    // Container is already initialized via singleton pattern
    // This method can be used for additional setup if needed
    const containerInstance = container.getContainer();
    
    if (!containerInstance.userService || !containerInstance.userController) {
      throw new Error('Dependency injection container initialization failed');
    }
  }

  private async verifySystemHealth(): Promise<void> {
    // Verify database connection
    if (!databaseConfig.isConnected()) {
      throw new Error('Database connection verification failed');
    }

    // Verify core services
    try {
      const userService = container.getUserService();
      if (!userService) {
        throw new Error('UserService not available');
      }
    } catch (error: any) {
      throw new Error(`Service verification failed: ${error.message}`);
    }
  }

  private sanitizeUri(uri: string): string {
    // Remove credentials from URI for logging
    return uri.replace(/mongodb(?:\+srv)?:\/\/([^:]+):([^@]+)@/, 'mongodb://*****:*****@');
  }

  public async shutdown(): Promise<void> {
    console.log('🔄 Starting graceful shutdown...');

    try {
      // Close database connection
      await databaseConfig.disconnect();
      console.log('✅ Database disconnected');

      // Reset container
      container.resetContainer();
      console.log('✅ Container reset');

      this.isInitialized = false;
      console.log('✅ Graceful shutdown completed');
    } catch (error: any) {
      console.error('❌ Shutdown error:', error.message);
      throw error;
    }
  }

  public isApplicationReady(): boolean {
    return this.isInitialized && databaseConfig.isConnected();
  }

  public getSystemInfo(): Record<string, unknown> {
    return {
      initialized: this.isInitialized,
      database: {
        connected: databaseConfig.isConnected(),
        uri: this.sanitizeUri(config.database.uri)
      },
      environment: config.nodeEnv,
      node: {
        version: process.version,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      },
      config: {
        port: config.port,
        docsEnabled: config.docs.enabled,
        corsOrigin: config.cors.origin
      }
    };
  }
}

// Export singleton instance
export const applicationBootstrap = new ApplicationBootstrap();