import {
    Resolver,
    Arg,
    Query,
} from 'type-graphql';

import { ApolloError } from 'apollo-server-express';
import SubjectModelGQL from '../model/graphql/subjectModelGQL';
import { iClassroom, iSubject } from '../utils/types/classroomTypes';
import SubjectModel from "../model/subject";
import ClassroomModel from "../model/classroom";

@Resolver(SubjectModelGQL)
export default class SUbjectResolver {


    // Private method to get a classroom by providing its id
    // =================================================
    private async getClassroomById(classroomId: string): Promise<iClassroom | null> {
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



    // Get classroom subjects by providing a classroomId
    // =================================================
    @Query(() => [SubjectModelGQL])
    public async getAllSubjects(
        @Arg('classroomId') classroomId: string
    ): Promise<iSubject | null> {

        const classroom: any = await this.getClassroomById(classroomId);

        const subjectsId: string[] = [];
        for (let i = 0; i < classroom.subject.length; i += 1) {
            subjectsId.push(classroom.subject[i].subjectId);
        }

        if (subjectsId.length === 0) {
            throw new ApolloError("No subjects in classroom")
        }
        const subjects: any = await this.getSubjectsByIds(subjectsId);
        return subjects;
    }
}