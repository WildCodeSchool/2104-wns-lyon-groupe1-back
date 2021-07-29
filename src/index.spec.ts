import "reflect-metadata";
import startServer from "./server"; //get only start server function
import config from "./config/env.testing"; //get testing environnement
import { gql } from "apollo-server-core";
import mongoose from "mongoose";
import { ApolloServer } from "apollo-server-express";
import { MongoMemoryServer } from "mongodb-memory-server"; //spinning mongo in memory for fast tests
import createTestClient from "apollo-server-testing";


/// resolver
const GET_ALL_CLASSROOMS = gql`{getAllClassrooms{_id, name, year}}`;


describe(
  'basic test suite',
  () => {
    let apollo: ApolloServer | null = null;
    let mongo: MongoMemoryServer = new MongoMemoryServer();

    beforeAll(
      async () => {
        mongo = new MongoMemoryServer();
        config.db = mongo.getUri();

        apollo = await startServer(config);
      }
    )

  });
