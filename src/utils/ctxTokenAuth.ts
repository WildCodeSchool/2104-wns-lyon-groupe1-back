import { Request } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env.dev';

type ctxParams = {
  req: Request;
};

export default async function ({ req }: ctxParams) {
  const token = req?.headers?.authorization || '';
  if (!token.length) return {};
  let user = {};
  try {
    const { data, exp, iat }: any = await jwt.verify(token, config.token);
    if (Date.now() >= exp) throw new Error('Token expiré');
    user = { ...data };
  } catch (err) {
  } finally {
    return { user };
  }
}
