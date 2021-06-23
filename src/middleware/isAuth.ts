import { ApolloError } from 'apollo-server-express';
import { MiddlewareFn, Mutation } from 'type-graphql';
import { MyContext } from '../types/context';
import jwt from 'jsonwebtoken';

export const isAuth: MiddlewareFn = async ({ context }: any, next) => {
  if (!context.user) {
    throw new ApolloError('Not Authenticated');
  }

  const token = context.req.header('auth-token');
  jwt.verify(token, process.env.TOKEN_SECRET || '');

  return next();
};
