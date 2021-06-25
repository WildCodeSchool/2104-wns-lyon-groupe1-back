import { Field, ObjectType, ID } from 'type-graphql';

@ObjectType()
export default class ClassroomModelGQL {
  @Field((type) => ID)
  _id : string = ''

  @Field()
  name: string = '';

  @Field()
  year: string = '';

  @Field((type) => [String])
  studentMails!: [string]
}
