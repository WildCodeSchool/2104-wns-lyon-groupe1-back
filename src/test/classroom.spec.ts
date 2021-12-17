import 'reflect-metadata';
import startServer from '../server'; //get only start server function
import config from '../config/env.testing';
import { gql } from 'apollo-server-core';
import mongoose from 'mongoose';
import { ApolloServer } from 'apollo-server-express';
import { MongoMemoryServer } from 'mongodb-memory-server-core'; //spinning mongo in memory for fast tests
import classroomModel from '../model/classroom';
import userModel from '../model/user';
import {
  mockClassroom,
  mockStudent1,
  mockStudent2,
  mockTeacher,
} from './mockClassroom';

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
//queyr to get all classrooms;
const GET_ALL_CLASSROOMS = gql`
  {
    getAllClassrooms {
      id
      name
      year
    }
  }
`;
//queyr to get a single classroom by defining its _id
const GET_CLASSROOM = gql`{getClassroom(id : "${mockClassroom._id}"){id, name, year}}`;
//mutation to add a classroom by defining classroomName,
const ADD_CLASSROOM = gql`
  mutation {
    addClassroom(
      classroomName: "dev"
      academicYear: "2012-2013"
      studentMails: ["eleve1@aca.com", "eleve2@aca.com"]
    ) {
      id
      name
      year
      student {
        userId
        mail
      }
    }
  }
`;

const GET_TOKEN_LOGIN = gql`
  mutation {
    login(mail:"${mockTeacher.mail}", password:"${mockTeacher.password}") {
      token
    }
  }
`;
//mutation to add a classroom by providing classroom _id and students email we want to add
const ADD_STUDENT_TO_CLASSROOM = gql`mutation{addStudentToClassroom(id: "${mockClassroom._id}", studentMail : "${mockStudent1.mail}"){id, student{mail}}
}`;

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

describe('classroom integration testing', () => {
  let apollo: ApolloServer;
  let mongo: MongoMemoryServer | null = null;
  let token: string;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    config.db = mongo.getUri();
  });

  beforeAll(async () => {
    apollo = await startServer(config);

    const newUserTeacher = new userModel({
      mail: mockTeacher.mail,
      password: mockTeacher.passwordHashed,
      isTeacher: true,
    });
    await newUserTeacher.save();
    const response = await apollo.executeOperation({
      query: GET_TOKEN_LOGIN,
    });
    token = response.data?.login.token || '';
  });

  beforeEach(async () => {
    const classroom = await classroomModel.findOne({ _id: mockClassroom._id });
    if (!classroom) {
      const newClassroom = await new classroomModel({
        _id: mockClassroom._id,
        name: mockClassroom.name,
        year: mockClassroom.year,
      });
      await newClassroom.save();
    }
  });

  afterEach(async () => {
    await classroomModel.deleteMany();
    await userModel.deleteMany();
  });

  afterAll(async () => {
    if (apollo !== null) {
      await apollo.stop();
    }
    await mongo?.stop(); //strop mongoDB in memory instance
    await mongoose.disconnect();
  });

  //===========================================================================================
  it('we are getting all classrooms', async () => {
    //empty the classroom of the mocked classroom the we insert before each test
    await classroomModel.deleteMany();

    const mockClassroom1 = {
      name: 'dev1',
      year: '2011-2012',
    };
    const mockClassroom2 = {
      name: 'dev2',
      year: '2012-2013',
    };

    const insertedClassroom1 = await new classroomModel({
      name: mockClassroom1.name,
      year: mockClassroom1.name,
    });
    await insertedClassroom1.save();

    const insertedClassroom2 = await new classroomModel({
      name: mockClassroom2.name,
      year: mockClassroom2.name,
    });
    await insertedClassroom2.save();

    const response = await apollo.executeOperation({
      query: GET_ALL_CLASSROOMS,
    });
    expect(response.errors).toBeUndefined();
    expect(response.data).toBeDefined();
    expect(response.data?.getAllClassrooms[0].name).toEqual(
      mockClassroom1.name,
    );
    expect(response.data?.getAllClassrooms[1].name).toEqual(
      mockClassroom2.name,
    );
  });

  //===========================================================================================
  it('we can get a classroom by id', async () => {
    const response = await apollo.executeOperation({
      query: GET_CLASSROOM,
    });
    expect(response.errors).toBeUndefined();
    expect(response.data).toBeDefined();
    expect(response.data?.getClassroom.id).toEqual(mockClassroom._id);
  });
  //===========================================================================================
  it('we can create a new classroom by giving academicYear, name, and student mails', async () => {
    const insertedStudent1 = new userModel({
      _id: mockStudent1._id,
      mail: mockStudent1.mail,
      isTeacher: false,
    });
    await insertedStudent1.save();

    const insertedStudent2 = new userModel({
      _id: mockStudent2._id,
      mail: mockStudent2.mail,
      isTeacher: false,
    });
    await insertedStudent2.save();

    const response = await apollo.executeOperation(
      {
        query: ADD_CLASSROOM,
      },
      { req: { headers: { authorization: token } } },
    );

    expect(response.data?.addClassroom.student[0].mail).toEqual(
      mockStudent1.mail,
    );
    expect(response.data?.addClassroom.student[1].mail).toEqual(
      mockStudent2.mail,
    );
    expect(response.data?.addClassroom.student[0].userId).toEqual(
      mockStudent1._id,
    );
    expect(response.data?.addClassroom.student[1].userId).toEqual(
      mockStudent2._id,
    );
  });
  //===========================================================================================

  it('we can add a student to a classroom by providing classroom id and student mail', async () => {
    const insertedStudent = await new userModel({
      _id: mockStudent1._id,
      mail: mockStudent1.mail,
      firstname: mockStudent1.firstname,
      lastname: mockStudent1.lastname,
    });
    await insertedStudent.save();

    const response = await apollo.executeOperation(
      {
        query: ADD_STUDENT_TO_CLASSROOM,
      },
      { req: { headers: { authorization: token } } },
    );

    expect(response.errors).toBeUndefined();
    expect(response.data).toBeDefined();
    expect(response.data?.addStudentToClassroom.id).toEqual(mockClassroom._id);
    expect(response.data?.addStudentToClassroom.student[0].mail).toEqual(
      mockStudent1.mail,
    );
    expect(true).toBeTruthy();
  });
});
