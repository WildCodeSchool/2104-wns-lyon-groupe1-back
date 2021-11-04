import { isListType } from 'graphql';
import { Field, ObjectType, ID, ArgsType, InputType } from 'type-graphql';

@ObjectType()
export default class FlashcardModelGQL {
  @Field((type) => ID)
  id!: string;

  @Field()
  title!: string;

  @Field((type) => [String])
  tag!: string[];

  @Field((type) => [Subtitle])
  subtitle!: Subtitle[];

  @Field((type) => [Ressource])
  ressource!: Ressource[];

  @Field((type) => [Question])
  question!: Question[];
}

@ObjectType()
class Question {
  @Field()
  text!: string;

  @Field((type) => [Answer])
  answer!: Answer[];

  @Field()
  date!: Date;

  @Field()
  author!: string;

  @Field()
  isPublic!: boolean;
}

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
export abstract class Ressource {
  @Field()
  name!: string;

  @Field()
  url!: string;
}

@ObjectType()
export abstract class Subtitle {
  @Field((type) => ID)
  id! : string

  @Field()
  title!: string;

  @Field()
  position!: number;

  @Field((type) => [Paragraph])
  paragraph!: Paragraph[];
}

@ObjectType()
export abstract class Paragraph {
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
