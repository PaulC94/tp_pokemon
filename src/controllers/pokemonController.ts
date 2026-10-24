import { GameRepository } from '../services/GameRepository';
import { handle } from './handle';
import { objectBody, pathId, positiveInteger, requiredName } from './validation';

const repository = new GameRepository();

export const createPokemon = handle(async (request, response) => {
  const body = objectBody(request.body);
  const pokemon = await repository.createPokemon(
    requiredName(body.name), positiveInteger(body.lifePoint, 'lifePoint')
  );
  response.status(201).json(pokemon);
});

export const listPokemons = handle(async (_request, response) => {
  response.json(await repository.listPokemons());
});

export const getPokemon = handle(async (request, response) => {
  response.json(await repository.getPokemon(pathId(request.params.id)));
});

export const learnAttack = handle(async (request, response) => {
  const body = objectBody(request.body);
  const pokemon = await repository.learnAttack(
    pathId(request.params.id), positiveInteger(body.attackId, 'attackId')
  );
  response.json(pokemon);
});
