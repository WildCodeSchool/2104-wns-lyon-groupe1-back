/* import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server"; //spinning mongo in memory for fast tests
import config from "../../config/env.testing"; //get testing environnement

const mongoServer = new MongoMemoryServer();

const dbConnection = async () => {
    const uri = mongoServer.getUri();
    await mongoose.connect()
    
}



export {dbConnection} */