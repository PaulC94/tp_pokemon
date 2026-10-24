import { GameRepository } from '../services/GameRepository';
import { handle } from './handle';
import { objectBody, pathId, positiveInteger, requiredName } from './validation';

const repository = new GameRepository();

export const createAttack = handle(async (request, response) => {
  const body = objectBody(request.body);
  const attack = await repository.createAttack(
    requiredName(body.name),
    positiveInteger(body.damage, 'damage'),
    positiveInteger(body.usageLimit, 'usageLimit')
  );
  response.status(201).json(attack);
});

export const listAttacks = handle(async (_request, response) => {
  response.json(await repository.listAttacks());
});

export const getAttack = handle(async (request, response) => {
  response.json(await repository.getAttack(pathId(request.params.id)));
});
