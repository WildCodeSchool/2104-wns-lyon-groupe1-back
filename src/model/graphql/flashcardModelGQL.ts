import { Field, ObjectType, ID } from 'type-graphql';

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
class Ressource {
  @Field()
  name!: string;
  url!: string;
}

@ObjectType()
class Subtitle {
  @Field()
  title!: string;

  @Field()
  position!: number;

  @Field((type) => [Paragraph])
  paragraph!: Paragraph[];
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
