import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType()
export default class UserModelGQL {
  @Field((type) => ID)
  _id : string = '';

  @Field()
  mail : string = '';

  @Field()
  firstname: string = '';

  @Field()
  lastname: string = '';

  @Field()
  password: string = '';

  @Field()
  isTeacher!: boolean;
}