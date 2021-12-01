import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resolver, Arg, Mutation, Query, Ctx } from 'type-graphql';
import { ApolloError } from 'apollo-server-express';
import UserModel from '../model/user';
import config from '../config/env.dev';
import { ITokenContext } from '../utils/interface';
import UserModelGQL from '../model/graphql/userModelGQL';
import { iUser } from '../utils/types/userTypes';

@Resolver(UserModelGQL)
export default class UserAuthResolver {
  // get user by id, @@@ don't delete this, because we should have at least one query in a resolver @@

  // Cette query semble inutile et inutilisé, on récupére l'utilisateur avec checkLogin en vérifiant que le token est valide

  // @Query((returns) => UserModelGQL)
  // public async getUser(@Arg('_id') _id: string) {
  //   const user = userModel.findOne({ _id });
  //   return user;
  // }

  // TODO user change password
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  @Mutation(() => Boolean)
  public async changePassword(
    @Arg('newPassword') newPassword: string,
    @Arg('oldPassword') oldPassword: string,
    @Ctx() ctx: ITokenContext,
  ) {
    const { user } = ctx;
    if (!user.id) throw new Error('401 - Unauthorized');

    try {
      const userInfo = await UserModel.findById(user.id);

      if (!userInfo) throw new Error();

      if (!(await bcrypt.compare(oldPassword, userInfo.password)))
        throw new Error();

      const hashedPassword = await bcrypt.hash(newPassword, 14);
      await UserModel.findOneAndUpdate(
        { _id: user.id },
        { $set: { password: hashedPassword } },
      );

      return true;
    } catch (e) {
      console.log(e);
      throw new ApolloError(
        'An error occured. Please verify your crediantials',
      );
    }
  }

  @Mutation(() => UserModelGQL)
  public async login(
    @Arg('mail') mail: string,
    @Arg('password') password: string,
  ) {
    try {
      const user : any = await UserModel.findOne({ mail });
      console.log(user);
      if (!user) throw new Error();
      if (!(await bcrypt.compare(password, user.password))) throw new Error();

      const userToken = await jwt.sign(
        {
          data: { mail: user.mail, id: user._id, isTeacher: user.isTeacher },
          exp: Date.now() + 86400000,
        },
        config.token,
      );

      user.token = userToken;
      user.id = user._id;
      delete user.password;
      return user;
    } catch (e) {
      throw new ApolloError('Cannot Login. Please verify credentials');
    }
  }

  @Mutation(() => UserModelGQL)
  public async checklogin(@Ctx() ctx: ITokenContext) {
    const { user } = ctx;

    try {
      const userInfo : any = await UserModel.findOne({ mail: user.mail });

      if (!userInfo) throw new Error();

      const userToken = await jwt.sign(
        {
          data: {
            mail: userInfo.mail,
            id: userInfo._id,
            isTeacher: userInfo.isTeacher,
          },
          exp: Date.now() + 86400000,
        },
        config.token,
      );

      userInfo.token = userToken;
      userInfo.id = userInfo._id;
      delete userInfo.password;
      return userInfo;
    } catch (e) {
      throw new ApolloError('Cannot Login. Please verify credentials');
    }
  }
}
