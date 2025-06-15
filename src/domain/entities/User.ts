import { Email } from '@/domain/value-objects/Email';
import { Username } from '@/domain/value-objects/Username';

export type UserRole = 'user' | 'admin';
export type SocialProvider = 'google' | 'facebook' | 'github';

export interface UserProfile {
  firstName: string;
  lastName: string;
  displayName?: string;
  gender?: 'male' | 'female' | 'other';
  avatarUrl?: string;
  phone?: string;
  dateOfBirth?: Date;
  bio?: string;
}

export interface Address {
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
}

export interface SocialAccount {
  id: string;
  provider: SocialProvider;
  providerId: string;
  providerEmail: string;
  providerData: Record<string, unknown>;
  linkedAt: Date;
  isActive: boolean;
}

export interface UserPreferences {
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
}

export interface UserProps {
  id?: string;
  username: Username;
  email: Email;
  passwordHash?: string;
  role: UserRole;
  profile: UserProfile;
  addresses: Address[];
  socialAccounts: SocialAccount[];
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  isSuspended: boolean;
  suspendedReason?: string;
  suspendedAt?: Date;
  preferences: UserPreferences;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  loginCount: number;
  customFields: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class User {
  private constructor(private props: UserProps) {}

  public static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User {
    const now = new Date();
    return new User({
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }

  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // Getters
  public get id(): string | undefined {
    return this.props.id;
  }

  public get username(): Username {
    return this.props.username;
  }

  public get email(): Email {
    return this.props.email;
  }

  public get role(): UserRole {
    return this.props.role;
  }

  public get profile(): UserProfile {
    return this.props.profile;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get isSuspended(): boolean {
    return this.props.isSuspended;
  }

  public get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  public get addresses(): Address[] {
    return this.props.addresses;
  }

  public get socialAccounts(): SocialAccount[] {
    return this.props.socialAccounts;
  }

  public get preferences(): UserPreferences {
    return this.props.preferences;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public get passwordHash(): string | undefined {
    return this.props.passwordHash;
  }

  public get loginCount(): number {
    return this.props.loginCount;
  }

  public get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  // Business Logic Methods
  public canLogin(): boolean {
    return this.props.isActive && !this.props.isSuspended && this.props.emailVerified;
  }

  public canAccessAdminFeatures(): boolean {
    return this.props.role === 'admin' && this.canLogin();
  }

  public canModifyUser(targetUserId: string): boolean {
    return this.props.role === 'admin' || this.props.id === targetUserId;
  }

  public getFullName(): string {
    const { firstName, lastName } = this.props.profile;
    return `${firstName} ${lastName}`.trim() || this.props.username.getValue();
  }

  public getDefaultAddress(): Address | undefined {
    return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
  }

  public hasLinkedSocialAccount(provider: SocialProvider): boolean {
    return this.socialAccounts.some(
      account => account.provider === provider && account.isActive
    );
  }

  // State Mutation Methods
  public updateProfile(profile: Partial<UserProfile>): void {
    this.props.profile = { ...this.props.profile, ...profile };
    this.props.updatedAt = new Date();
  }

  public updatePreferences(preferences: Partial<UserPreferences>): void {
    this.props.preferences = { ...this.props.preferences, ...preferences };
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public suspend(reason: string): void {
    this.props.isSuspended = true;
    this.props.suspendedReason = reason;
    this.props.suspendedAt = new Date();
    this.props.updatedAt = new Date();
  }

  public unsuspend(): void {
    this.props.isSuspended = false;
    this.props.suspendedReason = undefined;
    this.props.suspendedAt = undefined;
    this.props.updatedAt = new Date();
  }

  public verifyEmail(): void {
    this.props.emailVerified = true;
    this.props.updatedAt = new Date();
  }

  public recordLogin(): void {
    this.props.lastLoginAt = new Date();
    this.props.lastActiveAt = new Date();
    this.props.loginCount += 1;
    this.props.updatedAt = new Date();
  }

  public changePassword(newPasswordHash: string): void {
    this.props.passwordHash = newPasswordHash;
    this.props.updatedAt = new Date();
  }

  public addAddress(address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): void {
    const { v4: uuidv4 } = require('uuid');
    const newAddress: Address = {
      ...address,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // If this is the first address or explicitly set as default
    if (this.props.addresses.length === 0 || address.isDefault) {
      // Set all other addresses to non-default
      this.props.addresses.forEach(addr => {
        addr.isDefault = false;
      });
      newAddress.isDefault = true;
    }

    this.props.addresses.push(newAddress);
    this.props.updatedAt = new Date();
  }

  public linkSocialAccount(
    provider: SocialProvider,
    providerId: string,
    providerEmail: string,
    providerData: Record<string, unknown> = {}
  ): void {
    const { v4: uuidv4 } = require('uuid');
    
    // Check if account already exists
    const existingAccountIndex = this.props.socialAccounts.findIndex(
      account => account.provider === provider && account.isActive
    );

    if (existingAccountIndex !== -1) {
      // Update existing
      this.props.socialAccounts[existingAccountIndex] = {
        ...this.props.socialAccounts[existingAccountIndex],
        providerId,
        providerEmail,
        providerData: { ...this.props.socialAccounts[existingAccountIndex].providerData, ...providerData },
        linkedAt: new Date()
      };
    } else {
      // Add new social account
      const newSocialAccount: SocialAccount = {
        id: uuidv4(),
        provider,
        providerId,
        providerEmail,
        providerData,
        linkedAt: new Date(),
        isActive: true
      };
      this.props.socialAccounts.push(newSocialAccount);
    }

    this.props.updatedAt = new Date();
  }

  // Export for persistence
  public toPlainObject(): UserProps {
    return {
      ...this.props,
      username: this.props.username,
      email: this.props.email
    };
  }
}
