import { Field, ObjectType, ID } from 'type-graphql';

@ObjectType()
export class ClassroomModelGQL {
  @Field((type) => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  year!: string;

  @Field((type) => [StudentModelGQL])
  student!: StudentModelGQL[];
}

@ObjectType()
class StudentModelGQL {
  @Field()
  userId!: string;

  @Field()
  firstname!: string;

  @Field()
  lastname!: string;

  @Field()
  mail!: string;
}
