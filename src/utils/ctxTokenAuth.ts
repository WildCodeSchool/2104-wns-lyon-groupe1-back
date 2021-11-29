import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from 'apollo-server-express';
import config from '../config/env.dev';
import {ITokenContext} from './interface';

type ctxParams = {
  req: Request;
};

export default async function contextToken ({ req }: ctxParams): Promise<Partial<ITokenContext>> {
  const token = req?.headers?.authorization || '';
  if (!token.length) return {};
  let user:Partial<ITokenContext> = {};
  try {
    const { data, exp }: any = await jwt.verify(token, config.token);
    if (Date.now() >= exp) throw new Error('Token expiré');
    user = { ...data };
<<<<<<< HEAD
  } catch (err) {
    console.log(err);
=======

    return { user };
  } catch (err) {
    throw new AuthenticationError('you must be logged in');
>>>>>>> dcd7c5c (Filter on flashcard with author and ispublic)
  }

  return user ;
}
