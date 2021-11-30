import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType()
class Classroom {
  @Field(() => ID)
  classroomId!: string;

  @Field()
  name!: string;

  @Field()
  year!: string;
}

@ObjectType()
export default class UserModelGQL {
  @Field(() => ID)
  id!: string;

  @Field()
  mail!: string;

  @Field()
  firstname!: string;

  @Field()
  lastname!: string;

  @Field()
  password!: string;

  @Field()
  isTeacher!: boolean;

  @Field()
  token!: string;

  @Field(() => [Classroom])
  classroom!: Classroom[];
}
