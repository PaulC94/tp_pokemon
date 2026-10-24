import { Router } from 'express';
import { deterministicChallenge, firstArena, randomChallenge, secondArena } from '../controllers/battleController';

export const battleRoutes = Router();
battleRoutes.post('/random', randomChallenge);
battleRoutes.post('/arena-1', firstArena);
battleRoutes.post('/deterministic', deterministicChallenge);
battleRoutes.post('/arena-2', secondArena);
