import { Server as HttpServer } from 'http';
import { Express } from 'express';
import { ExpressApp } from './express/ExpressApp';
import { applicationBootstrap } from '@/infrastructure/config/bootstrap';
import config from '@/infrastructure/config/app';

export class Server {
  private httpServer: HttpServer | null = null;
  private expressApp: ExpressApp;
  private isRunning = false;

  constructor() {
    this.expressApp = new ExpressApp();
  }

  public async start(): Promise<void> {
    try {
      console.log('🚀 Starting User Service Server...');

      // Bootstrap application
      const bootstrapResult = await applicationBootstrap.initialize();
      if (!bootstrapResult.success) {
        throw new Error(bootstrapResult.message);
      }

      // Start HTTP server
      const app = this.expressApp.getApp();
      this.httpServer = app.listen(config.port, () => {
        console.log(`
╭─────────────────────────────────────────╮
│           🎉 Server Started!           │
├─────────────────────────────────────────┤
│ Port:         ${config.port.toString().padEnd(24)} │
│ Environment:  ${config.nodeEnv.padEnd(24)} │
│ Database:     ${bootstrapResult.details?.database.connected ? '✅ Connected'.padEnd(24) : '❌ Disconnected'.padEnd(24)} │
│ API Docs:     ${config.docs.enabled ? '✅ /api-docs'.padEnd(24) : '❌ Disabled'.padEnd(24)} │
│ Health:       ✅ /health${' '.repeat(15)} │
╰─────────────────────────────────────────╯
        `);

        console.log('Available endpoints:');
        console.log('  📊 Health Check:    GET  /health');
        console.log('  📊 Detailed Health: GET  /health/detailed');
        console.log('  👤 User Register:   POST /api/v1/users/register');
        console.log('  🔐 User Login:      POST /api/v1/users/login');
        console.log('  👥 List Users:      GET  /api/v1/users (Admin)');
        console.log('  🔍 Search Users:    GET  /api/v1/users/search');
        
        if (config.docs.enabled) {
          console.log(`  📚 API Documentation: http://localhost:${config.port}/api-docs`);
        }
        
        console.log('');
      });

      this.setupGracefulShutdown();
      this.isRunning = true;

    } catch (error: any) {
      console.error('❌ Server startup failed:', error.message);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    if (!this.httpServer || !this.isRunning) {
      console.log('⚠️ Server is not running');
      return;
    }

    console.log('🔄 Stopping server...');

    return new Promise((resolve, reject) => {
      this.httpServer!.close(async (error) => {
        if (error) {
          console.error('❌ Error stopping HTTP server:', error.message);
          reject(error);
          return;
        }

        try {
          // Graceful shutdown of application
          await applicationBootstrap.shutdown();
          
          this.isRunning = false;
          console.log('✅ Server stopped successfully');
          resolve();
        } catch (shutdownError: any) {
          console.error('❌ Error during application shutdown:', shutdownError.message);
          reject(shutdownError);
        }
      });
    });
  }

  private setupGracefulShutdown(): void {
    const handleShutdown = (signal: string) => {
      console.log(`\n🔄 Received ${signal}, initiating graceful shutdown...`);
      
      this.stop()
        .then(() => {
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        })
        .catch((error) => {
          console.error('❌ Error during graceful shutdown:', error.message);
          process.exit(1);
        });
    };

    // Handle different shutdown signals
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      this.stop().finally(() => process.exit(1));
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      this.stop().finally(() => process.exit(1));
    });
  }

  public getApp(): Express {
    return this.expressApp.getApp();
  }

  public isServerRunning(): boolean {
    return this.isRunning;
  }

  public getServerInfo(): Record<string, unknown> {
    return {
      running: this.isRunning,
      port: config.port,
      environment: config.nodeEnv,
      docs: config.docs.enabled,
      application: applicationBootstrap.getSystemInfo()
    };
  }
}