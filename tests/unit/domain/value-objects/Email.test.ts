import { Email } from '@/domain/value-objects/Email';

describe('Email Value Object', () => {
  describe('Valid emails', () => {
    it('should create email with valid format', () => {
      const email = new Email('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = new Email('Test@Example.COM');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = new Email('  test@example.com  ');
      expect(email.getValue()).toBe('test@example.com');
    });
  });

  describe('Invalid emails', () => {
    it('should throw error for invalid email format', () => {
      expect(() => new Email('invalid-email')).toThrow('Invalid email format');
      expect(() => new Email('test@')).toThrow('Invalid email format');
      expect(() => new Email('@example.com')).toThrow('Invalid email format');
      expect(() => new Email('')).toThrow('Invalid email format');
    });
  });

  describe('Equality', () => {
    it('should be equal when values are same', () => {
      const email1 = new Email('test@example.com');
      const email2 = new Email('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should not be equal when values are different', () => {
      const email1 = new Email('test1@example.com');
      const email2 = new Email('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('Static validation', () => {
    it('should validate email formats correctly', () => {
      expect(Email.isValid('test@example.com')).toBe(true);
      expect(Email.isValid('user.name@domain.co.uk')).toBe(true);
      expect(Email.isValid('invalid-email')).toBe(false);
      expect(Email.isValid('')).toBe(false);
    });
  });
});
