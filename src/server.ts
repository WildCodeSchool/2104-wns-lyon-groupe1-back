import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import { buildSchema } from 'type-graphql';
import { GraphQLSchema } from 'graphql';
import verifToken from './utils/ctxTokenAuth';
import { IConfig } from './config/env.dev';
import UserAuthResolver from './controller/UserAuthResolver';
import ClassroomResolver from './controller/ClassroomResolver';
import FlashcardResolver from './controller/FlashcardResolver';
import SubjectResolver from './controller/subjectResolver';

export default async function startServer(
  config: IConfig,
): Promise<ApolloServer> {
  // on décrit un schéma graphQl à l'aide de la foncton buildSchema
  const schema: GraphQLSchema = await buildSchema({
    validate: false,
    resolvers: [UserAuthResolver, ClassroomResolver, FlashcardResolver, SubjectResolver],
  }); // on démarre notre apollo server
  const server: ApolloServer = new ApolloServer({
    schema,
    context: verifToken,
  });

  if (config.serverStart) {
    const app: express.Application = express();

    app.use(cors({ origin: '*' }));

    app.use(morgan('dev'));
    app.use('/public', express.static('public'));
    
    await server.start();
    server.applyMiddleware({ app, path: '/' });
    app.listen(config.serverPort, () => {
      console.log('launch');
    });

    if (config.verbose) {
      console.log(
        `Apollo server started at: http://localhost:${config.serverPort}/`,
      );
    }
  }
  // et on démarre mongoose
  await mongoose.connect(config.db, config.options);

  if (config.verbose) console.log('mongodb started at uri: ', config.db);

  return server;
}
