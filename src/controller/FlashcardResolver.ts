import { Resolver, Arg, Mutation, Query, Ctx } from 'type-graphql';
import { ApolloError } from 'apollo-server-express';
import mongoose from 'mongoose';
import classroomModel from '../model/classroom';
import FlashcardModelGQL from '../model/graphql/flashcardModelGQL';

@Resolver(FlashcardModelGQL)
export default class FlashcardResolver {
  @Query((returns) => [FlashcardModelGQL])
  public async getAllFlashcards(@Arg('classroomId') classroomId: string) {
    const classroom = await classroomModel.findById(classroomId);

    if (!classroom) {
      throw new ApolloError('Classroom not found');
    }

    return classroom.subject.reduce((acc: any, cur: any) => {
      cur.flashcard.forEach((flash: any) => {
        acc.push(flash);
      });
      return acc;
    }, []);
  }

  @Query((returns) => FlashcardModelGQL)
  public async getFlashcard(
    @Arg('flashcardId') flashcardId: string,
    @Arg('classroomId') classroomId: string,
  ) {
    const classroom = await classroomModel.findOne(
      {
        _id: classroomId,
        subject: {
          $elemMatch: { flashcard: { $elemMatch: { _id: flashcardId } } },
        },
      },
      ['subject.flashcard.$'],
    );

    if (!classroom) {
      throw new ApolloError('Classroom not found');
    }

    return classroom.subject[0].flashcard.filter(
      (f: any) => f._id.toString() === flashcardId,
    )[0];

    // je laisse ça ici pour continuer de chercher sur du temps libre

    // const class2 = await classroomModel
    //   .aggregate()
    //   .match({
    //     _id: mongoose.Types.ObjectId(classroomId),
    //     'subject.flashcard': {
    //       $elemMatch: { _id: mongoose.Types.ObjectId(flashcardId) },
    //     },
    //   })
    //   .unwind('$subject')
    //   .unwind('$subject.flashcard')
    //   .match({
    //     'subject.flashcard._id': mongoose.Types.ObjectId(flashcardId),
    //   })
    //   .group({
    //     _id: '$subject.flashcard._id',
    //     title: { $first: '$subject.flashcard.title' },
    //     tag: { $first: '$subject.flashcard.tag' },
    //     subtitle: { $first: '$subject.flashcard.subtitle' },
    //     ressource: { $first: '$subject.flashcard.ressource' },
    //     question: { $first: '$subject.flashcard.question' },
    //   })
    //   .exec();
    // console.log(class2);
    // return class2;
  }

  // made for test and add quickly flashcard, return is not correct
  @Mutation((returns) => FlashcardModelGQL)
  public async createFlashcard(
    @Arg('classroomId') classroomId: string,
    @Arg('subjectId') subject: string,
  ) {
    const flash = [
      {
        title: 'Ma premiere fiche',
        tag: ['math', 'debut'],
        subtitle: [
          {
            title: 'Partie 1',
            position: 1,
            paragraph: [
              {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing',
                isValidate: true,
                isPublic: true,
                author: 'JOjo',
                date: '1631253299',
              },
            ],
          },
          {
            title: 'Partie 2',
            position: 2,
            paragraph: [
              {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing',
                isValidate: true,
                isPublic: true,
                author: 'JOjo',
                date: '1631253352',
              },
            ],
          },
        ],
        ressource: [
          {
            name: 'first ressource',
            url: 'link',
          },
          {
            name: 'second ressource',
            url: 'link',
          },
        ],
        question: [
          {
            text: 'What if...?',
            answer: [
              {
                text: 'Hmm good question...',
                author: 'Kang',
                date: '1631260499',
              },
            ],
            date: 1631256899,
            author: 'Tony S.',
            isPublic: true,
          },
        ],
      },
    ];
    const old = await classroomModel.findOne({
      _id: classroomId,
      subject: { $elemMatch: { subjectId: subject } },
    });

    const classr = await classroomModel.findOneAndUpdate(
      { _id: classroomId, subject: { $elemMatch: { subjectId: subject } } },
      { $push: { 'subject.$.flashcard': flash } },
      { new: true },
    );

    return classr;
  }
}
