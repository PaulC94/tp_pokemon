import { Router } from 'express';
import { createAttack, getAttack, listAttacks } from '../controllers/attackController';

export const attackRoutes = Router();
attackRoutes.post('/', createAttack);
attackRoutes.get('/', listAttacks);
attackRoutes.get('/:id', getAttack);
