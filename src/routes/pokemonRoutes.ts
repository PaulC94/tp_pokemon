import { Router } from 'express';
import { createPokemon, getPokemon, learnAttack, listPokemons } from '../controllers/pokemonController';

export const pokemonRoutes = Router();
pokemonRoutes.post('/', createPokemon);
pokemonRoutes.get('/', listPokemons);
pokemonRoutes.get('/:id', getPokemon);
pokemonRoutes.post('/:id/attacks', learnAttack);
