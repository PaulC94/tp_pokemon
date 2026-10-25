import express, { ErrorRequestHandler } from 'express';
import path from 'node:path';
import { AppError } from './AppError';
import { attackRoutes } from './routes/attackRoutes';
import { battleRoutes } from './routes/battleRoutes';
import { pokemonRoutes } from './routes/pokemonRoutes';
import { trainerRoutes } from './routes/trainerRoutes';

export const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/attacks', attackRoutes);
app.use('/pokemons', pokemonRoutes);
app.use('/trainers', trainerRoutes);
app.use('/battles', battleRoutes);

app.use((_request, _response, next) => next(new AppError('Route not found', 404)));

const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.status).json({ error: error.message });
    return;
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if (error.code === '23505') {
      response.status(409).json({ error: 'This value already exists' });
      return;
    }
    if (error.code === '23514' || error.code === '22003') {
      response.status(400).json({ error: 'Invalid value' });
      return;
    }
  }
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: 'Invalid JSON' });
    return;
  }
  console.error(error);
  response.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);
