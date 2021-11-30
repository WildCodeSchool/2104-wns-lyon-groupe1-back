import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType()
class Classroom {
  @Field((type) => ID)
  classroomId!: string;

  @Field()
  name!: string;

  @Field()
  year!: string;
}

@ObjectType()
export default class UserModelGQL {
  @Field((type) => ID)
  id = '';

  @Field()
  mail = '';

  @Field()
  firstname = '';

  @Field()
  lastname = '';

  @Field()
  password = '';

  @Field()
  isTeacher!: boolean;

  @Field()
  token!: string;

  @Field((type) => [Classroom])
  classroom!: Classroom[];
}

