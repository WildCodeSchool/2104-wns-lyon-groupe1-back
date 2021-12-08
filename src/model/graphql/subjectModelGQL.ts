import { Field, ObjectType, ID } from 'type-graphql';

@ObjectType()
export class SubjectModelGQL {
    @Field(()=> ID)
    id! : string;

    @Field()
    imageUrl! : string;

    @Field()
    name! : string 
}

@ObjectType()
class CustomFlashcardModelGQL{
    @Field(() => ID)
    id!: string;
  
    @Field()
    title!: string;
  
    @Field(() => [String])
    tag!: string[];
}

@ObjectType()
export class SubjectFlashcardModelGQL {
    
    // returned subjectId
    @Field(()=> ID)
    id! : string;

    @Field()
    imageUrl! : string;

    @Field()
    name! : string 

    @Field(() => [CustomFlashcardModelGQL])
    flashcard! : CustomFlashcardModelGQL[];
}