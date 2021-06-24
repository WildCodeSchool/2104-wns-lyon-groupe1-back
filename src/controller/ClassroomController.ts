import userModel from '../model/user';
import classroomModel from '../model/classroom';
import { Query, Mutation, UseMiddleware, Resolver, Arg } from 'type-graphql';
import { ApolloError } from 'apollo-server-express';
import isTeacher from '../middleware/isTeacher';
import ClassroomModelGQL from "../model/classroom"

@Resolver(ClassroomModelGQL)
export default class Classroom {
  @Mutation((returns) => String)
  public async addClassroom(
    @Arg('classroomName') classroomName: string,
    @Arg('academicYear') academicYear: string,
    @Arg('student', type => [String] ) student : string
  ) {
    //TODO check if classroom already exists in the wanted academic year, if yes => error
    //TODO check if a student is repeated more than one time => if yes error
    //TODO check if all students have a good email format
    //TODO test what would happen if there is two classrooms with the same name
    const classroom = await classroomModel.findOne({ name: classroomName });
    if (classroom && classroom.year === academicYear) {
      throw new ApolloError(
        'a classroom with the same academic year already exists',
      );
    }

    classroom.push({
      name: classroomName,
      year: academicYear,
      student: student,
    });

    await classroom.save();
    return 'good';
  }

  //TODO test what would happen if there is more than one classroom with the same name
/*   @UseMiddleware(isAuth)
  @Query((returns) => String)
  public async getClassroomStudents(
    @Arg('classroomName') classroomName: String,
    @Arg('academicYear') academicYear: String,
    @Arg('student') student : [string]
  ) {
    const classroom = await classroomModel.findOne({ name: classroomName });
  } */

  @Mutation((returns) => String)
  public async addStudentToClassroom(
    student_id : string,
    classroom_id : string
  ){
    // const student = await userModel.findOne({_id : })
  }
}
