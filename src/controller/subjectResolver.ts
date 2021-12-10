import { Resolver, Arg, Query } from 'type-graphql';

import { ApolloError } from 'apollo-server-express';
import {
  SubjectModelGQL,
  SubjectFlashcardModelGQL,
} from '../model/graphql/subjectModelGQL';
import { iClassroom, iSubject } from '../utils/types/classroomTypes';
import SubjectModel from '../model/subject';
import ClassroomModel from '../model/classroom';

@Resolver(SubjectModelGQL)
export default class SubjectResolver {
  // Private method to get a classroom by providing its id
  // =================================================
  private async getClassroomById(
    classroomId: string,
  ): Promise<iClassroom | null> {
    try {
      const classroom = await ClassroomModel.findOne({ _id: classroomId });
      return classroom;
    } catch {
      throw new Error('cannot find classroom');
    }
  }

  // =================================================
  private async getSubjectsByIds(
    subjectsIds: string[],
  ): Promise<iSubject[] | null> {
    try {
      const subjects = await SubjectModel.find({ _id: { $in: subjectsIds } });
      return subjects;
    } catch {
      throw new Error('Cannot get subjects');
    }
  }

  // get all subjects, (from subjects collection)
  // =================================================
  @Query(() => [SubjectModelGQL])
  public async getAllSubjects(): Promise<iSubject[] | null> {
    try {
      const subjects = await SubjectModel.find({});
      return subjects;
    } catch {
      // Useless error ... unless there is an error with mongoDb for example
      throw new ApolloError('Could not get subjects');
    }
  }

  // Get classroom subjects by providing a classroomId
  // =================================================
  @Query(() => [SubjectModelGQL])
  public async getAllSubjectsByClassroom(
    @Arg('classroomId') classroomId: string,
  ): Promise<iSubject[] | null> {
    try {
      const classroom = await this.getClassroomById(classroomId);
      // { idCOllection : idOfArraySubjectCLassroom }
      const subjectsId: { [key: string]: string } = {};
      if (!classroom) {
        throw new Error('cannot find classroom');
      }

      classroom.subject.forEach((subject: iSubject) => {
        subjectsId[subject.subjectId] = subject._id;
      });
      if (!Object.keys(subjectsId).length) {
        throw new Error('No subjects in classroom');
      }

      const subjects = await this.getSubjectsByIds(Object.keys(subjectsId));
      if (!subjects) {
        throw new Error('Cannot get subjects');
      }

      for (let i = 0; i < subjects.length; i += 1) {
        subjects[i]._id = subjectsId[subjects[i]._id];
      }
      return subjects;
    } catch (error: any) {
      throw new ApolloError(error.message);
    }
  }

  // Get subjects flashcards
  // =================================================
  @Query(() => SubjectFlashcardModelGQL)
  public async getAllFlashcardsBySubject(
    @Arg('classroomId') classroomId: string,
    @Arg('subjectId') subjectId: string,
  ): Promise<iSubject | null> {
    try {
      const classroom = await ClassroomModel.findOne(
        { _id: classroomId, subject: { $elemMatch: { _id: subjectId } } },
        ['subject.$'],
      );
      if (!classroom) {
        throw new Error('cannot find classroom');
      }
      return classroom.subject[0];
    } catch {
      throw new Error('cannot find classroom');
    }
  }
}
