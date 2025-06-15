import mongoose from 'mongoose';

export class DatabaseConfig {
  private connection: typeof mongoose | null = null;

  public async connect(uri: string): Promise<typeof mongoose> {
    try {
      const options: mongoose.ConnectOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4
        retryWrites: true
      };

      this.connection = await mongoose.connect(uri, options);
      
      // Connection event handlers
      mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB connected successfully');
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', this.disconnect.bind(this));
      process.on('SIGTERM', this.disconnect.bind(this));

      return this.connection;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.connection) {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
      }
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }

  public getConnection(): typeof mongoose | null {
    return this.connection;
  }

  public isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}

export const databaseConfig = new DatabaseConfig();
