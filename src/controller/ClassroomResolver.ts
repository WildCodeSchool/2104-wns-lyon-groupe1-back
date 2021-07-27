import userModel from '../model/user';
import classroomModel from '../model/classroom';
import { Query, Mutation, Resolver, Arg } from 'type-graphql';
import { ApolloError } from 'apollo-server-express';
import { ClassroomModelGQL } from '../model/graphql/classroomModelGQL';
import isMail from '../bin/isMail';
import UserModelGQL from '../model/graphql/userModelGQL';

@Resolver(ClassroomModelGQL)
export default class ClassroomResolver {
  //get all classrooms
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  @Query((returns) => [ClassroomModelGQL])
  public async getAllClassrooms() {
    const classrooms = await classroomModel.find();
    console.log(classrooms);
    return classrooms;
  }

  //get classroom
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  @Query((returns) => [UserModelGQL])
  public async getClassroom(
    @Arg('name') classroomName: string,
    @Arg('year') academicYear: string,
  ) {
    const classroom = await classroomModel.findOne({
      name: classroomName,
      year: academicYear,
    });
    if (!classroom) {
      throw new ApolloError('classroom does not exist');
    }
    return classroom.student;
  }

  //add classroom
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @Mutation((returns) => ClassroomModelGQL)
  public async addClassroom(
    @Arg('classroomName') classroomName: string,
    @Arg('academicYear') academicYear: string,
    @Arg('studentMails', (type) => [String]) studentMails: [string],
  ) {


    //make unique Mails
    //==================================
    const studentMailsUnique = [...new Set(studentMails)];
    //==================================


    let students = await userModel.find({
      'mail': { $in: studentMailsUnique },
      'isTeacher': false
    });

    if (students.length !== studentMails.length) {
      // renvoyé les emails non insrits !
      throw new ApolloError('not all emails exist as users');
    }

    const newStudents = students.map(s => ({firstname: s.firstname, lastname: s.lastname, mail: s.mail, userId: s._id}));
 
    try {
      //create a new classroom with the wanted values
      const newClassroom = await new classroomModel({
        name: classroomName,
        year: academicYear,
        student: newStudents,
      });

      //map over wanted student and add classroom in each one
      studentMailsUnique.map(async (mail) => {
        await userModel.findOneAndUpdate(
          { mail: mail },
          {
            $push: {
              classroom: {
                classroomId: newClassroom._id,
                name: newClassroom.name,
                year: newClassroom.year,
              },
            },
          },
        );
      });
      //save classroom
      return await newClassroom.save();
    } catch (error) {
      console.log(error);
      throw new ApolloError('Could not add a new classroom');
    }
  }

  //add student to classroom
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  @Mutation((returns) => UserModelGQL)
  public async addStudentToClassroom(
    @Arg('studentMail') studentMail: string,
    @Arg('classroomName') classroomName: string,
    @Arg('academicYear') academicYear: string,
  ) {
    //=============================================
    //check if student exists and is not a teacher
    const student = await userModel.findOne({ mail: studentMail });
    if (!student || student.isTeacher === true) {
      throw new ApolloError('Does not exist or is a teacher');
    }

    //=============================================
    //check if classroom && academic year exist ?
    const classroom = await classroomModel.findOne({
      name: classroomName,
      year: academicYear,
    });

    if (!classroom) {
      throw new ApolloError('Not a classroom');
    }
    //=============================================
    //Check if student is already in class room, if yes throw an error
    const alreadyInClassroom = student.classroom.filter(
      (studentClassroom: any) => {
        return studentClassroom.classroomId == classroom._id;
      },
    );
    if (alreadyInClassroom.length > 0) {
      throw new ApolloError('Student already in classroom');
    }
    //=============================================

    if (isMail(studentMail)) {
      try {
        await classroomModel.findOneAndUpdate(
          { _id: classroom._id },
          {
            $push: {
              student: {
                firstname: student.firstname,
                lastname: student.lastname,
                mail: student.mail,
              },
            },
          },
        );

        await userModel.findOneAndUpdate(
          { _id: student._id },
          {
            $push: {
              classroom: {
                classroomId: classroom._id,
                name: classroom.name,
                year: classroom.year,
              },
            },
          },
        );
        return student;
      } catch {
        throw new ApolloError('Error adding student to the classroom');
      }
    }
  }
}