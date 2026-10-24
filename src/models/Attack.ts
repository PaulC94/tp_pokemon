import { AppError } from '../AppError';

export class Attack {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly damage: number,
    public readonly usageLimit: number,
    public usageCount = 0
  ) {}

  get isUsable(): boolean {
    return this.usageCount < this.usageLimit;
  }

  use(): number {
    if (!this.isUsable) {
      throw new AppError(`Attack ${this.name} has reached its usage limit`, 409);
    }
    this.usageCount++;
    return this.damage;
  }

  reset(): void {
    this.usageCount = 0;
  }

  info(): string {
    return `${this.name}: ${this.damage} damage, ${this.usageCount}/${this.usageLimit} uses`;
  }
}
