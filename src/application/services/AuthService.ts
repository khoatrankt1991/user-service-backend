import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IAuthService } from './UserService';

export class AuthService implements IAuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshExpiresIn: string;
  private readonly bcryptRounds: number = 12;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
  }

  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptRounds);
  }

  public async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public generateAccessToken(payload: Record<string, unknown>): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    });
  }

  public generateRefreshToken(payload: Record<string, unknown>): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtRefreshExpiresIn
    });
  }

  public verifyToken(token: string): Record<string, unknown> {
    try {
      return jwt.verify(token, this.jwtSecret) as Record<string, unknown>;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  public generateRandomToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  public generateNumericCode(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min.toString();
  }
}
