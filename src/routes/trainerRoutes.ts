import { Router } from 'express';
import { addPokemon, createTrainer, getTrainer, listTrainers, visitTavern } from '../controllers/trainerController';

export const trainerRoutes = Router();
trainerRoutes.post('/', createTrainer);
trainerRoutes.get('/', listTrainers);
trainerRoutes.get('/:id', getTrainer);
trainerRoutes.post('/:id/pokemons', addPokemon);
trainerRoutes.post('/:id/tavern', visitTavern);
