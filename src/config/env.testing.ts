import {TOptions} from '../utils/types';

const options:TOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
};

const db = 'mongodb://127.0.0.1:27017/wiki-notes-test';

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
  serverPort: 5001,
  serverStart: false,
  verbose: false,
  token: 'notsecure123',
};

export default config;
