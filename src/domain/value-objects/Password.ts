export class Password {
  private readonly value: string;

  constructor(password: string) {
    if (!Password.isValid(password)) {
      throw new Error('Password must be at least 8 characters long');
    }
    this.value = password;
  }

  public static isValid(password: string): boolean {
    return Boolean(password) && password.length >= 8;
  }

  public getValue(): string {
    return this.value;
  }
}
