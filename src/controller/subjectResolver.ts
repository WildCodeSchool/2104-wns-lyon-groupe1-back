import {
    Resolver,
    Arg,
    Query,
} from 'type-graphql';

import { ApolloError } from 'apollo-server-express';
import { SubjectModelGQL, SubjectFlashcardModelGQL } from '../model/graphql/subjectModelGQL';
import { iClassroom, iSubject } from '../utils/types/classroomTypes';
import SubjectModel from "../model/subject";
import ClassroomModel from "../model/classroom";

@Resolver(SubjectModelGQL)
export default class SubjectResolver {

    // Private method to get a classroom by providing its id
    // =================================================
    private async getClassroomById(classroomId: string): Promise<iClassroom | null > {
        try {
            const classroom = await ClassroomModel.findOne({ _id: classroomId });
            return classroom;
        }
        catch {
            throw new ApolloError("cannot find classroom")
        }
    }

    // =================================================
    private async getSubjectsByIds(subjectsIds: string[]): Promise<iSubject[] | null> {
        try {
            const subjects = await SubjectModel.find({ _id: { $in: subjectsIds } });
            return subjects;
        }
        catch {
            throw new ApolloError("Cannot get subjects");
        }
    }


    // private method to get subject located in a classroom by providing classroom object and subjectId
    // =================================================
    private getSubjectById(classroom: iClassroom, subjectId: string): iSubject | undefined {
        const subject = classroom.subject.find(
            (currentSubject: iSubject) => currentSubject.subjectId.toString() === subjectId
        )
        return subject
    }


    // Get classroom subjects by providing a classroomId
    // =================================================
    @Query(() => [SubjectModelGQL])
    public async getAllSubjectsByClassroom(
        @Arg('classroomId') classroomId: string
    ): Promise<iSubject | null> {

        const classroom = await this.getClassroomById(classroomId);
        const subjectsId: string[] = [];
        if(!classroom){
            throw new ApolloError("Could not get classroom");
        }

        for (let i = 0; i < classroom.subject.length; i += 1) {
            subjectsId.push(classroom.subject[i].subjectId);
        }

        if (subjectsId.length === 0) {
            throw new ApolloError("No subjects in classroom")
        }
        const subjects :any = await this.getSubjectsByIds(subjectsId);
        return subjects;
    }

    // Get subjects flashcards 
    // =================================================
    @Query(() => SubjectFlashcardModelGQL)
    public async getAllFlashcardsBySubject(
        @Arg('classroomId') classroomId: string,
        @Arg('subjectId') subjectId: string
    ): Promise<iSubject | null> {

        const classroom = await this.getClassroomById(classroomId);
        const subject = classroom && this.getSubjectById(classroom, subjectId);
        if(!subject){
            throw new ApolloError("Could not get subject")
        }

        return subject;
    }
}