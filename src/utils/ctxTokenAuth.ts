import { Request } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env.dev';
import { ITokenContext } from './interface';

type ctxParams = {
  req: Request;
};

export default async function contextToken({
  req,
}: ctxParams): Promise<{ user?: Partial<ITokenContext> }> {
  const token = req?.headers?.authorization || '';
  if (!token.length) return {};
  let user: Partial<ITokenContext> = {};
  try {
    const { data, exp }: any = await jwt.verify(token, config.token);
    if (Date.now() >= exp) throw new Error('Token expiré');
    user = { ...data };
    return { user };
  } catch (err) {
    return {};
  }
}
