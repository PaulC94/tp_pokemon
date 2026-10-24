import { AppError } from '../AppError';
import { Pokemon } from './Pokemon';

export class Trainer {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public level = 1,
    public experience = 0,
    public readonly pokemons: Pokemon[] = []
  ) {}

  addPokemon(pokemon: Pokemon): void {
    if (this.pokemons.some(ownedPokemon => ownedPokemon.id === pokemon.id)) {
      throw new AppError('This Pokemon already belongs to the trainer', 409);
    }
    this.pokemons.push(pokemon);
  }

  tavern(): void {
    this.pokemons.forEach(pokemon => pokemon.heal());
  }

  gainExperience(amount: number): void {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new AppError('Experience must be a non-negative integer', 400);
    }
    const total = this.experience + amount;
    this.level += Math.floor(total / 10);
    this.experience = total % 10;
  }

  get livingPokemons(): Pokemon[] {
    return this.pokemons.filter(pokemon => pokemon.isAlive);
  }
}
