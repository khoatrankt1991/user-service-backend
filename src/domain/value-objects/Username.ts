export class Username {
  private readonly value: string;

  constructor(username: string) {
    if (!Username.isValid(username)) {
      throw new Error('Invalid username format');
    }
    this.value = username.trim();
  }

  public static isValid(username: string): boolean {
    if (!username || username.trim().length < 3 || username.trim().length > 50) {
      return false;
    }
    return /^[a-zA-Z0-9_]+$/.test(username.trim());
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Username): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
