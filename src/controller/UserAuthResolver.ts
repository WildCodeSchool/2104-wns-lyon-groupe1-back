import bcrypt from "bcrypt";
import userModel from "../model/user";
import { sign } from "jsonwebtoken";
import { Resolver, Query, Arg, Mutation } from "type-graphql";
import User from "../model/graphql/user";



@Resolver(User)
export default class UserAuth {


    //get user by email
    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @Query(returns => User, { nullable: true })
    public async getUserByEmail(
        @Arg("email", type => String) email: string
    ) {
        const user = await userModel.findOne({ _email: email });
        return user;
    }

    //user register
    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @Mutation(returns => User)
    public async registerUser(
        @Arg("email") email: string,
        @Arg("firstname") firstname: string,
        @Arg("lastname") lastname: string,
        @Arg("password") password: string,
        @Arg("isTeacher") isTeacher: boolean,
    ) {

        //verify is user already exist,
        const userExist = this.getUserByEmail(email);
        if (userExist) {
            throw new Error("User already exist");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await userModel.init();
        const body: any = {
            email: email,
            firstname: firstname,
            lastname: lastname,
            password: hashedPassword,
            isTeacher: isTeacher
        }
        const model = new userModel(body);
        const result = await model.save();
        return result;
    }
}