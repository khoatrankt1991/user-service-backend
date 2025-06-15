import 'dotenv/config';
import { Server } from '@/infrastructure/web/Server';

/**
 * Main application entry point
 * 
 * This file bootstraps and starts the User Service application.
 * It follows Clean Architecture principles and handles:
 * - Dependency injection setup
 * - Database initialization
 * - Server startup
 * - Graceful shutdown
 */

async function main(): Promise<void> {
  const server = new Server();
  
  try {
    await server.start();
  } catch (error: any) {
    console.error('❌ Failed to start application:', error.message);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Application startup error:', error);
    process.exit(1);
  });
}

export { main };