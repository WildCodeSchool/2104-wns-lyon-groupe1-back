import 'reflect-metadata';
import dotenv from 'dotenv';
import config from './config/env.dev';
import startServer from './server';

dotenv.config();

startServer(config);
