import { GameRepository } from '../services/GameRepository';
import { handle } from './handle';
import { objectBody, pathId, positiveInteger, requiredName } from './validation';

const repository = new GameRepository();

export const createTrainer = handle(async (request, response) => {
  const body = objectBody(request.body);
  response.status(201).json(await repository.createTrainer(requiredName(body.name)));
});

export const listTrainers = handle(async (_request, response) => {
  response.json(await repository.listTrainers());
});

export const getTrainer = handle(async (request, response) => {
  response.json(await repository.getTrainer(pathId(request.params.id)));
});

export const addPokemon = handle(async (request, response) => {
  const body = objectBody(request.body);
  response.json(await repository.addPokemon(
    pathId(request.params.id), positiveInteger(body.pokemonId, 'pokemonId')
  ));
});

export const visitTavern = handle(async (request, response) => {
  const trainerId = pathId(request.params.id);
  const trainer = await repository.changeTrainers([trainerId], trainers => {
    trainers[0].tavern();
    return trainers[0];
  });
  response.json(trainer);
});
