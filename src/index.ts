import 'reflect-metadata';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from "type-graphql";
import { GraphQLSchema } from "graphql";
import mongoose from "mongoose";
import config from "../.env.dev"
import userAuthResolver from "./controller/UserAuthResolver";


dotenv.config();
// const devEnv = config;

const initialize = async () => {

  //Connect to database===================================
  mongoose.connect(config.db, config.options)
    .then(() => { console.log("MongoDb started") })
    .catch((error) => {
      console.log(error);
    })
  //Connect to database===================================


  const app = express();

  //TODO do not forget to not allow * here
  app.use(cors({ origin: '*' }));
  app.use(express.json());

  //keep the extended true, otherwise you will get deprecated warnings
  app.use(express.urlencoded({ extended: true }));

  app.use(morgan('dev'));

  const schema: GraphQLSchema = await buildSchema(
    {
      resolvers: [userAuthResolver]
    },
  )

  const server = new ApolloServer(
    {
      schema
        //putting req & res in ApolloServer onctext will let us access them globally in resolvers
      // context: ({ req, res }) => ({ req, res })
    },
  );



  await server.start();
  server.applyMiddleware({ app, path: '/' });
  app.listen(4000, () => {
    console.log('launch');
  });
  console.log('Server Apollo Running on http://localhost:4000 ');
};

initialize();

