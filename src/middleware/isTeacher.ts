import userModel from "../model/user";

import { ApolloError } from 'apollo-server-express';
import { MiddlewareFn } from 'type-graphql';

export default async function isTeacher({context}: any, next: any): Promise<MiddlewareFn<{}>>{
    
    return next();
}