import { AppError } from '../AppError';
import { BattleService } from '../services/BattleService';
import { GameRepository } from '../services/GameRepository';
import { handle } from './handle';
import { objectBody, positiveInteger } from './validation';

const repository = new GameRepository();
const battles = new BattleService();

function trainerIds(bodyValue: unknown): [number, number] {
  const body = objectBody(bodyValue);
  const firstId = positiveInteger(body.firstTrainerId, 'firstTrainerId');
  const secondId = positiveInteger(body.secondTrainerId, 'secondTrainerId');
  if (firstId === secondId) throw new AppError('Choose two different trainers', 400);
  return [firstId, secondId];
}

export const randomChallenge = handle(async (request, response) => {
  const result = await repository.changeTrainers(trainerIds(request.body), ([first, second]) => ({
    ...battles.randomChallenge(first, second), firstTrainer: first, secondTrainer: second
  }));
  response.json(result);
});

export const firstArena = handle(async (request, response) => {
  const result = await repository.changeTrainers(trainerIds(request.body), ([first, second]) =>
    battles.firstArena(first, second));
  response.json(result);
});

export const deterministicChallenge = handle(async (request, response) => {
  const result = await repository.changeTrainers(trainerIds(request.body), ([first, second]) => ({
    ...battles.deterministicChallenge(first, second), firstTrainer: first, secondTrainer: second
  }));
  response.json(result);
});

export const secondArena = handle(async (request, response) => {
  const result = await repository.changeTrainers(trainerIds(request.body), ([first, second]) =>
    battles.secondArena(first, second));
  response.json(result);
});
