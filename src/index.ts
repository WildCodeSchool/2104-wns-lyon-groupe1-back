import 'reflect-metadata';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';

dotenv.config();

const initialize = async () => {
  const app = express();
  app.use(cors({ origin: '*' }));
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(morgan('dev'));

  const schema = await buildSchema({ resolvers: [] });
  const server = new ApolloServer({ schema });

  await server.start();
  server.applyMiddleware({ app, path: '/' });
  app.listen(4000, () => {
    console.log('launch');
  });
  console.log('Server Apollo Running on http://localhost:4000 ');
};

initialize();
