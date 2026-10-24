import { AppError } from '../AppError';
import { Pokemon } from '../models/Pokemon';
import { Trainer } from '../models/Trainer';

export interface ChallengeResult {
  winnerId: number | null;
  firstPokemonId: number;
  secondPokemonId: number;
  turns: number;
}

export interface ArenaResult {
  winnerId: number | null;
  challenges: number;
  firstWins: number;
  secondWins: number;
  firstTrainer: Trainer;
  secondTrainer: Trainer;
}

export class BattleService {
  randomChallenge(first: Trainer, second: Trainer): ChallengeResult {
    this.requirePokemons(first, second);
    first.tavern();
    second.tavern();
    const firstPokemon = this.randomPokemon(first.pokemons);
    const secondPokemon = this.randomPokemon(second.pokemons);
    return this.fight(first, second, firstPokemon, secondPokemon);
  }

  firstArena(first: Trainer, second: Trainer): ArenaResult {
    this.requirePokemons(first, second);
    let firstWins = 0;
    let secondWins = 0;
    for (let count = 0; count < 100; count++) {
      const result = this.randomChallenge(first, second);
      if (result.winnerId === first.id) firstWins++;
      if (result.winnerId === second.id) secondWins++;
    }
    let winnerId: number | null = null;
    if (first.level > second.level ||
        (first.level === second.level && first.experience > second.experience)) {
      winnerId = first.id;
    } else if (second.level > first.level ||
        (second.level === first.level && second.experience > first.experience)) {
      winnerId = second.id;
    }
    return { winnerId, challenges: 100, firstWins, secondWins,
      firstTrainer: first, secondTrainer: second };
  }

  deterministicChallenge(first: Trainer, second: Trainer): ChallengeResult {
    const firstPokemon = this.strongestLivingPokemon(first);
    const secondPokemon = this.strongestLivingPokemon(second);
    return this.fight(first, second, firstPokemon, secondPokemon);
  }

  secondArena(first: Trainer, second: Trainer): ArenaResult {
    let challenges = 0;
    let firstWins = 0;
    let secondWins = 0;
    while (challenges < 100 && first.livingPokemons.length > 0 &&
           second.livingPokemons.length > 0) {
      const result = this.deterministicChallenge(first, second);
      challenges++;
      if (result.winnerId === first.id) firstWins++;
      if (result.winnerId === second.id) secondWins++;
      if (result.winnerId === null) break;
    }
    let winnerId: number | null = null;
    if (first.livingPokemons.length === 0 && second.livingPokemons.length > 0) {
      winnerId = second.id;
    } else if (second.livingPokemons.length === 0 && first.livingPokemons.length > 0) {
      winnerId = first.id;
    } else if (challenges === 100) {
      if (firstWins > secondWins) winnerId = first.id;
      if (secondWins > firstWins) winnerId = second.id;
    }
    return { winnerId, challenges, firstWins, secondWins,
      firstTrainer: first, secondTrainer: second };
  }

  private fight(first: Trainer, second: Trainer,
    firstPokemon: Pokemon, secondPokemon: Pokemon): ChallengeResult {
    let turns = 0;
    let firstAttacks = true;
    while (firstPokemon.isAlive && secondPokemon.isAlive) {
      const attacker = firstAttacks ? firstPokemon : secondPokemon;
      const defender = firstAttacks ? secondPokemon : firstPokemon;
      if (!attacker.hasAvailableAttack() && !defender.hasAvailableAttack()) break;
      attacker.attack(defender);
      turns++;
      firstAttacks = !firstAttacks;
    }
    let winnerId: number | null = null;
    if (!secondPokemon.isAlive) winnerId = first.id;
    if (!firstPokemon.isAlive) winnerId = second.id;
    if (winnerId === first.id) first.gainExperience(1);
    if (winnerId === second.id) second.gainExperience(1);
    return { winnerId, firstPokemonId: firstPokemon.id,
      secondPokemonId: secondPokemon.id, turns };
  }

  private requirePokemons(first: Trainer, second: Trainer): void {
    if (first.pokemons.length === 0 || second.pokemons.length === 0) {
      throw new AppError('Both trainers need at least one Pokemon', 409);
    }
  }

  private randomPokemon(pokemons: Pokemon[]): Pokemon {
    return pokemons[Math.floor(Math.random() * pokemons.length)];
  }

  private strongestLivingPokemon(trainer: Trainer): Pokemon {
    const living = trainer.livingPokemons;
    if (living.length === 0) {
      throw new AppError(`Trainer ${trainer.name} has no living Pokemon`, 409);
    }
    return living.reduce((best, pokemon) =>
      pokemon.lifePoint > best.lifePoint ? pokemon : best);
  }
}
