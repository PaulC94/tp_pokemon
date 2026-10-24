import { AppError } from '../AppError';
import { Attack } from './Attack';

export class Pokemon {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public lifePoint: number,
    public readonly initialLifePoint: number,
    public readonly attacks: Attack[] = []
  ) {}

  get isAlive(): boolean {
    return this.lifePoint > 0;
  }

  learnAttack(attack: Attack): void {
    if (this.attacks.length >= 4) {
      throw new AppError('A Pokemon can know at most four attacks', 409);
    }
    if (this.attacks.some(knownAttack => knownAttack.id === attack.id)) {
      throw new AppError('This Pokemon already knows the attack', 409);
    }
    this.attacks.push(attack);
  }

  heal(): void {
    this.lifePoint = this.initialLifePoint;
    this.attacks.forEach(attack => attack.reset());
  }

  attack(target: Pokemon): Attack | null {
    if (!this.isAlive) {
      throw new AppError('A fainted Pokemon cannot attack', 409);
    }
    const availableAttacks = this.attacks.filter(attack => attack.isUsable);
    if (availableAttacks.length === 0) {
      return null;
    }
    const selected = availableAttacks[Math.floor(Math.random() * availableAttacks.length)];
    target.takeDamage(selected.use());
    return selected;
  }

  hasAvailableAttack(): boolean {
    return this.attacks.some(attack => attack.isUsable);
  }

  private takeDamage(damage: number): void {
    this.lifePoint = Math.max(0, this.lifePoint - damage);
  }
}
