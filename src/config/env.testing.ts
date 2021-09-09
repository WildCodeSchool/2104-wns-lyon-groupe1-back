const options ={
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
}

const db = "mongodb://127.0.0.1:27017/wiki-notes-test";

export interface IConfig {
    db: string,
    options : any,
    serverPort : number,
    serverStart : boolean,
    verbose : boolean,
}

const config : IConfig = {
    db : db,
    options : options,
    serverPort : 5001,
    serverStart : false,
    verbose : false,
}

export default config;