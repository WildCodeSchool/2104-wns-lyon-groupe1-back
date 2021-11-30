import dotenv from 'dotenv';
import { TOptions } from '../utils/types'

dotenv.config();



const options:TOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
};

const db = `mongodb://${
  process.env.NODE_ENV === 'production' ? 'mongodb' : 'localhost'
}:27017/wiki-notes`;

export interface IConfig {
  db: string;
  options: TOptions;
  serverPort: number;
  serverStart: boolean;
  verbose: boolean;
  token: string;
}

const config: IConfig = {
  db,
  options,
  serverPort: Number(process.env.PORT) || 5000,
  serverStart: true,
  verbose: true,
  token: process.env.JWT_KEY || 'notsecure',
};

export default config;
