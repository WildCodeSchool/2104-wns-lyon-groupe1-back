import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resolver, Arg, Mutation, Ctx } from 'type-graphql';
import { ApolloError } from 'apollo-server-express';
import UserModel from '../model/user';
import config from '../config/env.dev';
import { ITokenContext } from '../utils/interface';
import UserModelGQL from '../model/graphql/userModelGQL';
import { iUser } from '../utils/types/userTypes';

@Resolver(UserModelGQL)
export default class UserAuthResolver {
  @Mutation(() => Boolean)
  public async changePassword(
    @Arg('newPassword') newPassword: string,
    @Arg('oldPassword') oldPassword: string,
    @Ctx() ctx: ITokenContext,
  ): Promise<boolean> {
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

  @Mutation(() => String)
  public async resetPassword(
    @Arg('mail') mail: string,
    @Ctx() ctx: ITokenContext,
  ): Promise<string> {
    const { user } = ctx;

    if (!user.id || !user.isTeacher) {
      throw new Error('401 - Unauthorized');
    }

    try {
      const hashedPassword = await bcrypt.hash('MonNouveauPassword145!', 14);
      const userInfo = await UserModel.findOneAndUpdate(
        { mail },
        { $set: { password: hashedPassword } },
      );
      if (!userInfo) throw new Error();
    } catch {
      throw new ApolloError('Cannot reset password');
    }

    return 'MonNouveauPassword145!';
  }

  @Mutation(() => UserModelGQL)
  public async login(
    @Arg('mail') mail: string,
    @Arg('password') password: string,
  ): Promise<Partial<iUser>> {
    try {
      const user = await UserModel.findOne({ mail });
      if (!user) throw new Error();
      if (!(await bcrypt.compare(password, user.password))) throw new Error();

      const userToken = await jwt.sign(
        {
          data: { mail: user.mail, id: user._id, isTeacher: user.isTeacher },
          exp: Date.now() + 86400000,
        },
        config.token,
      );

      const userWthoutPassword: Partial<iUser> = {
        ...user.toObject(),
      };
      userWthoutPassword.token = userToken;
      userWthoutPassword.id = user._id;
      delete userWthoutPassword.password;
      return userWthoutPassword;
    } catch (e) {
      throw new ApolloError('Cannot Login. Please verify credentials');
    }
  }

  @Mutation(() => UserModelGQL)
  public async checklogin(@Ctx() ctx: ITokenContext): Promise<Partial<iUser>> {
    const { user } = ctx;

    try {
      const userInfo = await UserModel.findOne({ mail: user.mail });

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

      const userWithoutPassword: Partial<iUser> = {
        ...userInfo.toObject(),
      };
      userWithoutPassword.token = userToken;
      userWithoutPassword.id = userInfo._id;
      userInfo.token = userToken;
      userInfo.id = userInfo._id;
      delete userWithoutPassword.password;
      return userWithoutPassword;
    } catch (e) {
      throw new ApolloError('Cannot Login. Please verify credentials');
    }
  }
}
