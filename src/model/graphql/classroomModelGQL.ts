import { Field, ObjectType, ID } from 'type-graphql';
import FlashcardModelGQL from './flashcardModelGQL';

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

  @Field((type) => [Subject])
  subject!: Subject[];
}

@ObjectType()
class Subject {
  @Field()
  subjectId!: string;

  @Field((type) => [FlashcardModelGQL])
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
