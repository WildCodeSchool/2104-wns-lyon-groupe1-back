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
    private async getClassroomById(classroomId: string): Promise<iClassroom | null> {
        try {
            const classroom = await ClassroomModel.findOne({ _id: classroomId });
            return classroom;
        }
        catch {
            throw new Error("cannot find classroom");
        }
    }

    // =================================================
    private async getSubjectsByIds(subjectsIds: string[]): Promise<iSubject[] | null> {
        try {
            const subjects = await SubjectModel.find({ _id: { $in: subjectsIds } });
            return subjects;
        }
        catch {
            throw new Error("Cannot get subjects");
        }
    }


    // private method to get subject located in a classroom by providing classroom object and subjectId
    // =================================================
    private getSubjectById(classroom: iClassroom, subjectId: string): iSubject | null {
        const subject = classroom.subject.find(
            (currentSubject: iSubject) => currentSubject.subjectId.toString() === subjectId
        )
        return subject || null;
    }

    // get all subjects, (from subjects collection)
    // =================================================
    @Query(() => [SubjectModelGQL])
    public async getAllSubejcts(): Promise<iSubject[] | null>{
        try {
            const subjects = await SubjectModel.find({});
            return subjects;
        }
        catch{
            // Useless error ... unless there is an error with mongoDb for example
            throw new ApolloError("Could not get subjects");
        }
    }

    // Get classroom subjects by providing a classroomId
    // =================================================
    @Query(() => [SubjectModelGQL])
    public async getAllSubjectsByClassroom(
        @Arg('classroomId') classroomId: string
    ): Promise<iSubject[] | null> {

        try{
            const classroom = await this.getClassroomById(classroomId);
            const subjectsCollectionIds: string[] = []; // subujects ids in subjects collection
            const subejctsId: string[] =[];
            if (!classroom) {
                throw new Error("cannot find classroom");
            }
    
            for (let i = 0; i < classroom.subject.length; i += 1) {
                subjectsCollectionIds.push(classroom.subject[i].subjectId);
                subejctsId.push(classroom.subject[i]._id!);
            }
    
            if (subjectsCollectionIds.length === 0) {
                throw new Error("No subjects in classroom");
            }
                const subjects = await this.getSubjectsByIds(subjectsCollectionIds);
                if(subjects){
                    for(let i= 0 ;i<subjects.length; i+=1){
                        subjects[i]._id =subejctsId[i];
                    }
                }
                
                return subjects;
        }
        catch(error : any){
            throw new ApolloError(error.message);
        }
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
        if (!subject) {
            throw new ApolloError("Could not get subject");
        }

        return subject;
    }
}