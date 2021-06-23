import bcrypt from 'bcrypt';
import userModel from '../model/user';
import jwt from 'jsonwebtoken';
import {
  Resolver,
  Query,
  Arg,
  Mutation,
  Ctx,
  UseMiddleware,
  Authorized,
} from 'type-graphql';
import User from '../model/graphql/user';
import { ApolloError, AuthenticationError } from 'apollo-server-express';
import { isAuth } from '../middleware/isAuth';

//TODO récupere une liste des éleves
//TODO mutation ajouter un eleve
//TODO mutation ajouter une promotion

@Resolver(User)
export default class UserAuth {
  //get user by email
  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @Query((returns) => User, { nullable: true })
  public async getUserByEmail(@Arg('email', (type) => String) email: string) {
    const user = await userModel.findOne({ email: email });
    return user;
  }

  //check by email if user already exists, if yes return true, otherwise return false
  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  private async userExists(email: string) {
    const userExist = await userModel.findOne({ email: email });
    if (userExist) {
      throw new AuthenticationError('User already exist');
    }
  }

  //user professor
  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  @Mutation((returns) => User)
  public async registerTeacher(
    @Arg('email') email: string,
    @Arg('firstname') firstname: string,
    @Arg('lastname') lastname: string,
    @Arg('password') password: string,
  ) {

    console.log("aze");
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
      isTeacher: true,
    };
    const model = new userModel(body);
    const result = await model.save();
    return result;
  }

  //user signin, if successfull return a token
  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @Query((returns) => String)
  public async userLogin(
    @Arg('email') email: string,
    @Arg('password') password: string,
  ) {
    //check if user already exists
    const user = await userModel.findOne({ email: email });
    if (!user) {
      throw new ApolloError('Wrong email or password');
    }
    //check if password is valid
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AuthenticationError('Wrong email or password');
    }
    //sign a token
    const user_id = user._id;
    const token = jwt.sign(user_id.toJSON(), process.env.TOKEN_SECRET || '');

    try {
      await userModel.findOneAndUpdate(
        { _id: user._id },
        { $set: { token: token } },
      );
    } catch (error) {
      throw new ApolloError('Error while signing a JWT');
    }
    //TODO push token into database
    return token;
  }

  //TODO user change password
  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @UseMiddleware(isAuth)
  @Mutation((returns) => User)
  public async changePassword(
    @Ctx() context: any,
    @Arg('newPassword', (type) => String) newPassword: string,
  ) {
    const regex = new RegExp(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
    );

    if (regex.test(newPassword) === true) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      try {
        const user = userModel.findOneAndUpdate(
          { _id: context.user },
          { $set: { password: hashedPassword } },
        );
        return user;
      } catch {
        throw new ApolloError('Error setting a new password');
      }
    }
    if (regex.test(newPassword) === false) {
      throw new ApolloError(
        'Password error : Minimum eight characters, at least one letter, one number and one special characte',
      );
    }
  }

  @UseMiddleware(isAuth)
  @Query((returns) => String)
  public async hello() {
    return 'hello world';
  }
}
