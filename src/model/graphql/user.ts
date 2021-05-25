import {Field, ID, ObjectType } from "type-graphql";


@ObjectType()
export default class User {
    @Field(type=> ID, {nullable: true})
    email : string = "";

    @Field(type => ID, {nullable : true})
    firstname : string = "";

    @Field(type => ID, {nullable : true})
    lastname : string = "";

    @Field(type => ID, {nullable : true})
    password : string = "";

    @Field(type => ID, {nullable: true})
    isTeacher : boolean = false;
}
