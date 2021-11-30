import { Field, ObjectType, ID, } from 'type-graphql';

@ObjectType()
class Answer {
  @Field()
  text!: string;

  @Field()
  date!: Date;

  @Field()
  author!: string;
}

@ObjectType()
class Question {
  @Field()
  text!: string;

  @Field(() => [Answer])
  answer!: Answer[];

  @Field()
  date!: Date;

  @Field()
  author!: string;

  @Field()
  isPublic!: boolean;
}

@ObjectType()
export abstract class Ressource {
  @Field()
  name!: string;

  @Field()
  url!: string;
}

@ObjectType()
class Paragraph {
  @Field()
  text!: string;

  @Field()
  isValidate!: boolean;

  @Field()
  isPublic!: boolean;

  @Field()
  author!: string;

  @Field()
  date!: Date;
}

@ObjectType()
export abstract class Subtitle {
  @Field()
  title!: string;

  @Field()
  position!: number;

  @Field(() => [Paragraph])
  paragraph!: Paragraph[];
}

@ObjectType()
export default class FlashcardModelGQL {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field(() => [String])
  tag!: string[];

  @Field(() => [Subtitle])
  subtitle!: Subtitle[];

  @Field(() => [Ressource])
  ressource!: Ressource[];

  @Field(() => [Question])
  question!: Question[];
}