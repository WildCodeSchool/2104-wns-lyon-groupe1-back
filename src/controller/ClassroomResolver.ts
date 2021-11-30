import { Query, Mutation, Resolver, Arg } from 'type-graphql';
import { ApolloError } from 'apollo-server-express';
import userModel from '../model/user';
import ClassroomModel from '../model/classroom';
import ClassroomModelGQL from '../model/graphql/classroomModelGQL';
import isMail from '../utils/isMail';

@Resolver(ClassroomModelGQL)
export default class ClassroomResolver {
  // get all classrooms
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  @Query(() => [ClassroomModelGQL])
  public async getAllClassrooms() {
    const classrooms = await ClassroomModel.find();
    return classrooms;
  }

  // get classroom
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  @Query(() => ClassroomModelGQL)
  public async getClassroom(@Arg('id') id: string) {
    const classroom = await ClassroomModel.findOne({
      _id: id,
    });
    if (!classroom) {
      throw new ApolloError('classroom does not exist');
    }
    return classroom;
  }

  // add classroom
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @Mutation(() => ClassroomModelGQL)
  public async addClassroom(
    @Arg('classroomName') classroomName: string,
    @Arg('academicYear') academicYear: string,
    @Arg('studentMails', () => [String]) studentMails: [string],
  ) {
    if (!studentMails.length)
      throw new ApolloError(
        'Only one student mail is required to create a classroom.',
      );
    // make unique Mails
    // ==================================
    const studentMailsUnique = [...new Set(studentMails)];
    // ==================================

    const students = await userModel.find({
      mail: { $in: studentMailsUnique },
      isTeacher: false,
    });

    if (students.length !== studentMails.length) {
      // renvoyé les emails non insrits !
      throw new ApolloError('not all emails exist as users');
    }

    const newStudents = students.map((s) => ({
      firstname: s.firstname,
      lastname: s.lastname,
      mail: s.mail,
      userId: s._id,
    }));

    try {
      // create a new classroom with the wanted values
      const newClassroom = await new ClassroomModel({
        name: classroomName,
        year: academicYear,
        student: newStudents,
      });

      // map over wanted student and add classroom in each one
      studentMailsUnique.map(async (mail) => {
        await userModel.findOneAndUpdate(
          { mail },
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
      // save classroom
      return await newClassroom.save();
    } catch (error) {
      console.log(error);
      throw new ApolloError('Could not add a new classroom');
    }
  }

  // add student to classroom
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  @Mutation(() => ClassroomModelGQL)
  public async addStudentToClassroom(
    @Arg('studentMail') studentMail: string,
    @Arg('id') id: string,
  ) {
    // =============================================
    // check if student exists and is not a teacher and student not in the classroom
    const student = await userModel.findOne({
      mail: studentMail,
      isTeacher: false,
      'classroom.classroomId': { $ne: id },
    });

    if (!student) {
      throw new ApolloError('Student does not exist');
    }

    if (!isMail(studentMail)) {
      throw new ApolloError('Email not in correct syntax ***@***.**');
    }

    const classRoom = await ClassroomModel.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          student: { ...student, userId: student._id },
        },
      },
      { new: true },
    );

    await userModel.findOneAndUpdate(
      { _id: student._id },
      {
        $push: {
          classroom: {
            classroomId: id,
            name: classRoom && classRoom.name,
            year: classRoom && classRoom.year,
          },
        },
      },
    );

    return classRoom;
  }
}
