import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface UserDocument extends Document {
  _id: string;
  username: string;
  email: string;
  passwordHash?: string;
  role: 'user' | 'admin';
  profile: {
    firstName: string;
    lastName: string;
    displayName?: string;
    gender?: 'male' | 'female' | 'other';
    avatarUrl?: string;
    phone?: string;
    dateOfBirth?: Date;
    bio?: string;
  };
  addresses: Array<{
    id: string;
    type: 'home' | 'work' | 'other';
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateProvince?: string;
    postalCode?: string;
    country: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  socialAccounts: Array<{
    id: string;
    provider: 'google' | 'facebook' | 'github';
    providerId: string;
    providerEmail: string;
    providerData: Record<string, unknown>;
    linkedAt: Date;
    isActive: boolean;
  }>;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  isSuspended: boolean;
  suspendedReason?: string;
  suspendedAt?: Date;
  preferences: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'friends' | 'private';
      showEmail: boolean;
      showPhone: boolean;
    };
  };
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  loginCount: number;
  customFields: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

const addressSchema = new Schema({
  id: { type: String, default: () => uuidv4(), required: true },
  type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  addressLine1: { type: String, required: true, trim: true },
  addressLine2: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  stateProvince: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const socialAccountSchema = new Schema({
  id: { type: String, default: () => uuidv4(), required: true },
  provider: { type: String, enum: ['google', 'facebook', 'github'], required: true },
  providerId: { type: String, required: true },
  providerEmail: { type: String, required: true, lowercase: true },
  providerData: { type: Schema.Types.Mixed, default: {} },
  linkedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const userSchema = new Schema<UserDocument>({
  _id: { type: String, default: () => uuidv4() },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  passwordHash: { type: String, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
  profile: {
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName: { type: String, required: true, trim: true, maxlength: 100 },
    displayName: { type: String, trim: true, maxlength: 100 },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    avatarUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Avatar URL must be a valid HTTP/HTTPS URL'
      }
    },
    phone: { type: String, trim: true, maxlength: 20 },
    dateOfBirth: { type: Date },
    bio: { type: String, maxlength: 500 }
  },
  addresses: [addressSchema],
  socialAccounts: [socialAccountSchema],
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },
  suspendedReason: { type: String },
  suspendedAt: { type: Date },
  preferences: {
    language: { type: String, default: 'en', match: /^[a-z]{2}$/ },
    timezone: { type: String, default: 'UTC' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false }
    }
  },
  lastLoginAt: { type: Date },
  lastActiveAt: { type: Date },
  loginCount: { type: Number, default: 0 },
  customFields: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String },
  updatedBy: { type: String }
}, {
  timestamps: true,
  versionKey: false,
  collection: 'users'
});

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ emailVerified: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });
userSchema.index({ 'socialAccounts.provider': 1, 'socialAccounts.providerId': 1 });
userSchema.index({ 'socialAccounts.providerEmail': 1 });

// Text search index for user discovery
userSchema.index({ 
  username: 'text', 
  'profile.firstName': 'text', 
  'profile.lastName': 'text',
  'profile.displayName': 'text'
});

// Middleware for timestamps
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

userSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export const UserModel = mongoose.model<UserDocument>('User', userSchema);
