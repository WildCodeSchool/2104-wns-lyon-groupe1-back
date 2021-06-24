import bcrypt from 'bcrypt';
import userModel from '../model/user';
import {
  Resolver,
  Arg,
  Mutation,
  Query
} from 'type-graphql';
import UserModelGQL from '../model/graphql/userModelGQL';
import { ApolloError } from 'apollo-server-express';

@Resolver(UserModelGQL)
export default class UserAuthResolver {

  //get user by id, @@@ don't delete this, because we should have at least one query in a resolver @@
  @Query((returns) => UserModelGQL)
  public async getUser(@Arg('user_id') user_id : string){
    const user = userModel.findOne({_id : user_id});
    return user;
  }

  //TODO user change password
  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @Mutation((returns) => UserModelGQL)
  public async changePassword(
    @Arg('user_id') user_id : string,
    @Arg('newPassword') newPassword: string,
  ) {
    const regex = new RegExp(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
    );

    if (regex.test(newPassword) === true) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      try {
        const user = userModel.findOneAndUpdate(
          { _id: user_id },
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
}
