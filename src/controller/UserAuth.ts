import bcrypt from "bcrypt";
import userModel from "../model/user";
import { sign } from "jsonwebtoken";
import { Resolver, Query, Arg, Mutation } from "type-graphql";
import User from "../model/graphql/user";
import { ApolloError, ValidationError } from "apollo-server-express";



@Resolver(User)
export default class UserAuth {
    //get user by email
    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @Query(returns => User, { nullable: true })
    public async getUserByEmail(
        @Arg("email", type => String) email: string
    ) {
        const user = await userModel.findOne({ email: email });
        console.log(user);
        return user;
    }

    //check by email if user already exists, if yes return true, otherwise return false
    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    private async userExists(email: string) {
        const userExist = await userModel.findOne({ email: email });
        if (userExist) {
            throw new ApolloError("Error registering a new user");
        }
    }

    //user professor
    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @Mutation(returns => User)
    public async registerTeacher(
        @Arg("email") email: string,
        @Arg("firstname") firstname: string,
        @Arg("lastname") lastname: string,
        @Arg("password") password: string
    ) {
        //verify by email if user exists
        await this.userExists(email);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await userModel.init();
        const body: any = {
            email: email,
            firstname: firstname,
            lastname: lastname,
            password: hashedPassword,
            isTeacher: true
        }
        const model = new userModel(body);
        const result = await model.save();
        return result;
    }

    //user student
    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    public async registerStudent(
        @Arg("email") email: string,
        @Arg("firstname") firstname: string,
        @Arg("lastname") lastname: string,
        @Arg("password") password: string
    ) {
        const userExist = this.getUserByEmail
    }
}
