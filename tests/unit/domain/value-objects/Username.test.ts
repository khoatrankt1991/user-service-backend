import { Username } from '@/domain/value-objects/Username';

describe('Username Value Object', () => {
  describe('Valid usernames', () => {
    it('should create username with valid format', () => {
      const username = new Username('validuser');
      expect(username.getValue()).toBe('validuser');
    });

    it('should allow alphanumeric and underscore', () => {
      const username = new Username('user_123');
      expect(username.getValue()).toBe('user_123');
    });

    it('should trim whitespace', () => {
      const username = new Username('  validuser  ');
      expect(username.getValue()).toBe('validuser');
    });
  });

  describe('Invalid usernames', () => {
    it('should throw error for too short username', () => {
      expect(() => new Username('ab')).toThrow('Invalid username format');
    });

    it('should throw error for too long username', () => {
      const longUsername = 'a'.repeat(51);
      expect(() => new Username(longUsername)).toThrow('Invalid username format');
    });

    it('should throw error for invalid characters', () => {
      expect(() => new Username('user-name')).toThrow('Invalid username format');
      expect(() => new Username('user@name')).toThrow('Invalid username format');
      expect(() => new Username('user name')).toThrow('Invalid username format');
    });

    it('should throw error for empty username', () => {
      expect(() => new Username('')).toThrow('Invalid username format');
    });
  });

  describe('Static validation', () => {
    it('should validate username formats correctly', () => {
      expect(Username.isValid('validuser')).toBe(true);
      expect(Username.isValid('user_123')).toBe(true);
      expect(Username.isValid('ab')).toBe(false);
      expect(Username.isValid('user-name')).toBe(false);
      expect(Username.isValid('')).toBe(false);
    });
  });
});
