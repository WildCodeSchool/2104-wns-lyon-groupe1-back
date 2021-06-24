import { ApolloError } from 'apollo-server-express';
import { MiddlewareFn } from 'type-graphql';
import jwt from 'jsonwebtoken';

export const isAuth: MiddlewareFn = async ({ context }: any, next) => {
    if (!context.user || context.user === '') {
      throw new ApolloError('Not Authenticated');
    }
  
    const token = context.req.header('auth-token');
    const user_id = jwt.verify(token, process.env.TOKEN_SECRET || '');
    context.user_id = user_id;
    
    await next();
  };
