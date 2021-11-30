import { Field, ObjectType, ID } from 'type-graphql';
import FlashcardModelGQL from './flashcardModelGQL';

@ObjectType()
class Subject {
  @Field()
  subjectId!: string;

  @Field(() => [FlashcardModelGQL])
  flashcard!: FlashcardModelGQL[];
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
@ObjectType()
export default class ClassroomModelGQL {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  year!: string;

  @Field(() => [StudentModelGQL])
  student!: StudentModelGQL[];

  @Field(() => [Subject])
  subject!: Subject[];
}
