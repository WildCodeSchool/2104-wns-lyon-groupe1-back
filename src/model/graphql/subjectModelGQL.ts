import { Field, ObjectType, ID } from 'type-graphql';


@ObjectType()
export default class SubjectModelGQL {
    @Field(()=> ID)
    _id! : string;

    @Field()
    imageUrl! : string;

    @Field()
    name! : string 
}