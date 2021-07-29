const options ={
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
}

const db = "mongodb://127.0.0.1:27017/wiki-notes";

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
    serverPort : 5000,
    serverStart : true,
    verbose : true,
}

export default config;