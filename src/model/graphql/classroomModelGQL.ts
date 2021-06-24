import { Field, ID, Mutation, ObjectType, UseMiddleware } from 'type-graphql';


@ObjectType()
export default class ClassroomModelGQL {
  @Field()
  name : string = '';

  @Field()
  academicYear: string = '';

  @Field()
  student! : [string]
}