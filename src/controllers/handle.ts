import { NextFunction, Request, RequestHandler, Response } from 'express';

export function handle(
  action: (request: Request, response: Response) => Promise<void>
): RequestHandler {
  return (request: Request, response: Response, next: NextFunction) => {
    action(request, response).catch(next);
  };
}
