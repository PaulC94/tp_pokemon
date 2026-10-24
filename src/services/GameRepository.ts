import { Pool, PoolClient } from 'pg';
import { AppError } from '../AppError';
import { pool } from '../config/database';
import { Attack } from '../models/Attack';
import { Pokemon } from '../models/Pokemon';
import { Trainer } from '../models/Trainer';

type Database = Pool | PoolClient;

interface AttackRow {
  id: number;
  name: string;
  damage: number;
  usage_limit: number;
  usage_count?: number;
}

interface PokemonRow {
  id: number;
  name: string;
  life_point: number;
  initial_life_point: number;
  trainer_id: number | null;
}

interface TrainerRow {
  id: number;
  name: string;
  level: number;
  experience: number;
}

export class GameRepository {
  async createAttack(name: string, damage: number, usageLimit: number): Promise<Attack> {
    const result = await pool.query<AttackRow>(
      'INSERT INTO attacks (name, damage, usage_limit) VALUES ($1, $2, $3) RETURNING *',
      [name, damage, usageLimit]
    );
    return this.attackFromRow(result.rows[0]);
  }

  async getAttack(id: number, database: Database = pool): Promise<Attack> {
    const result = await database.query<AttackRow>('SELECT * FROM attacks WHERE id = $1', [id]);
    if (!result.rows[0]) throw new AppError('Attack not found', 404);
    return this.attackFromRow(result.rows[0]);
  }

  async listAttacks(): Promise<Attack[]> {
    const result = await pool.query<AttackRow>('SELECT * FROM attacks ORDER BY id');
    return result.rows.map(row => this.attackFromRow(row));
  }

  async createPokemon(name: string, lifePoint: number): Promise<Pokemon> {
    const result = await pool.query<PokemonRow>(
      'INSERT INTO pokemons (name, life_point, initial_life_point) VALUES ($1, $2, $2) RETURNING *',
      [name, lifePoint]
    );
    return this.pokemonFromRow(result.rows[0], []);
  }

  async getPokemon(id: number, database: Database = pool): Promise<Pokemon> {
    const result = await database.query<PokemonRow>('SELECT * FROM pokemons WHERE id = $1', [id]);
    const row = result.rows[0];
    if (!row) throw new AppError('Pokemon not found', 404);
    const attackResult = await database.query<AttackRow>(
      `SELECT a.id, a.name, a.damage, a.usage_limit, pa.usage_count
       FROM pokemon_attacks pa JOIN attacks a ON a.id = pa.attack_id
       WHERE pa.pokemon_id = $1 ORDER BY a.id`,
      [id]
    );
    return this.pokemonFromRow(row, attackResult.rows);
  }

  async listPokemons(): Promise<Pokemon[]> {
    const result = await pool.query<PokemonRow>('SELECT * FROM pokemons ORDER BY id');
    return Promise.all(result.rows.map(row => this.getPokemon(row.id)));
  }

  async learnAttack(pokemonId: number, attackId: number): Promise<Pokemon> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM pokemons WHERE id = $1 FOR UPDATE', [pokemonId]);
      const pokemon = await this.getPokemon(pokemonId, client);
      const attack = await this.getAttack(attackId, client);
      pokemon.learnAttack(attack);
      await client.query(
        'INSERT INTO pokemon_attacks (pokemon_id, attack_id) VALUES ($1, $2)',
        [pokemonId, attackId]
      );
      await client.query('COMMIT');
      return pokemon;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createTrainer(name: string): Promise<Trainer> {
    const result = await pool.query<TrainerRow>(
      'INSERT INTO trainers (name) VALUES ($1) RETURNING *', [name]
    );
    return this.trainerFromRow(result.rows[0], []);
  }

  async getTrainer(id: number, database: Database = pool): Promise<Trainer> {
    const result = await database.query<TrainerRow>('SELECT * FROM trainers WHERE id = $1', [id]);
    const row = result.rows[0];
    if (!row) throw new AppError('Trainer not found', 404);
    const pokemonResult = await database.query<PokemonRow>(
      'SELECT * FROM pokemons WHERE trainer_id = $1 ORDER BY id', [id]
    );
    const pokemons = await Promise.all(
      pokemonResult.rows.map(pokemonRow => this.getPokemon(pokemonRow.id, database))
    );
    return this.trainerFromRow(row, pokemons);
  }

  async listTrainers(): Promise<Trainer[]> {
    const result = await pool.query<TrainerRow>('SELECT * FROM trainers ORDER BY id');
    return Promise.all(result.rows.map(row => this.getTrainer(row.id)));
  }

  async addPokemon(trainerId: number, pokemonId: number): Promise<Trainer> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM trainers WHERE id = $1 FOR UPDATE', [trainerId]);
      const trainer = await this.getTrainer(trainerId, client);
      const result = await client.query<PokemonRow>(
        'SELECT * FROM pokemons WHERE id = $1 FOR UPDATE', [pokemonId]
      );
      if (!result.rows[0]) throw new AppError('Pokemon not found', 404);
      if (result.rows[0].trainer_id !== null) {
        throw new AppError('This Pokemon already has a trainer', 409);
      }
      const pokemon = await this.getPokemon(pokemonId, client);
      trainer.addPokemon(pokemon);
      await client.query('UPDATE pokemons SET trainer_id = $1 WHERE id = $2', [trainerId, pokemonId]);
      await client.query('COMMIT');
      return trainer;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async changeTrainers<T>(ids: number[], change: (trainers: Trainer[]) => T): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const sortedIds = [...ids].sort((a, b) => a - b);
      await client.query(
        'SELECT id FROM trainers WHERE id = ANY($1::integer[]) ORDER BY id FOR UPDATE',
        [sortedIds]
      );
      const trainers = await Promise.all(ids.map(id => this.getTrainer(id, client)));
      const result = change(trainers);
      for (const trainer of trainers) {
        await this.saveTrainer(client, trainer);
      }
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async saveTrainer(client: PoolClient, trainer: Trainer): Promise<void> {
    await client.query(
      'UPDATE trainers SET level = $1, experience = $2 WHERE id = $3',
      [trainer.level, trainer.experience, trainer.id]
    );
    for (const pokemon of trainer.pokemons) {
      await client.query('UPDATE pokemons SET life_point = $1 WHERE id = $2',
        [pokemon.lifePoint, pokemon.id]);
      for (const attack of pokemon.attacks) {
        await client.query(
          'UPDATE pokemon_attacks SET usage_count = $1 WHERE pokemon_id = $2 AND attack_id = $3',
          [attack.usageCount, pokemon.id, attack.id]
        );
      }
    }
  }

  private attackFromRow(row: AttackRow): Attack {
    return new Attack(row.id, row.name, row.damage, row.usage_limit, row.usage_count ?? 0);
  }

  private pokemonFromRow(row: PokemonRow, attacks: AttackRow[]): Pokemon {
    return new Pokemon(row.id, row.name, row.life_point, row.initial_life_point,
      attacks.map(attack => this.attackFromRow(attack)));
  }

  private trainerFromRow(row: TrainerRow, pokemons: Pokemon[]): Trainer {
    return new Trainer(row.id, row.name, row.level, row.experience, pokemons);
  }
}
