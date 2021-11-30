import { Resolver, Arg, Mutation, Query, InputType, Field, ArgsType, Args, Ctx } from 'type-graphql';
import { ApolloError } from 'apollo-server-express';
import mongoose from 'mongoose';
import ClassroomModel from '../model/classroom';
import FlashcardModelGQL, { Ressource, Subtitle } from '../model/graphql/flashcardModelGQL';




@ArgsType()
class CreateFlahsCard implements Partial<FlashcardModelGQL>  {
  @Field()
  classroomId!: string;

  @Field()
  subjectId!: string;

  @Field()
  title!: string;

  @Field((type) => [String])
  tag!: string[];

  @Field((type) => [CreateSubtitle])
  subtitle!: CreateSubtitle[];

  @Field((type) => [CreateRessource])
  ressource!: CreateRessource[];
}

@InputType()
class CreateRessource extends Ressource {
  @Field()
  name!: string;

  @Field()
  url!: string;
}

@InputType()
class CreateSubtitle extends Subtitle {
  @Field()
  title!: string;

  @Field()
  position!: number;
}


@Resolver(FlashcardModelGQL)
export default class FlashcardResolver {
  @Query((returns) => [FlashcardModelGQL])
  public async getAllFlashcards(@Arg('classroomId') classroomId: string) {
    const classroom = await ClassroomModel.findById(classroomId);

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
    const classroom = await ClassroomModel.findOne(
      {
        _id: classroomId,
        subject: {
          $elemMatch: { flashcard: { $elemMatch: { _id: flashcardId } } },
        },
      },
      ['subject.flashcard.$'],
    );

    if (!classroom) {
      throw new ApolloError('Flashcard not found');
    }

    return classroom.subject[0].flashcard.filter(
      (f: any) => f._id.toString() === flashcardId,
    )[0];

    // je laisse ça ici pour continuer de chercher sur du temps libre

    // const class2 = await ClassroomModel
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
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @Mutation((returns) => FlashcardModelGQL)
  public async createFlashcard(
    @Args() {
      classroomId,
      subjectId,
      title,
      ressource,
      tag,
      subtitle
    }
      : CreateFlahsCard
  ) {
    if (title === "" || tag.length === 0 || ressource.length === 0 || subtitle.length === 0) {
      throw new ApolloError(
        'title / tag / ressources / subtitles are required',
      );
    }


    // Check if flashcard is exist, if yes throw error otherwise continu
    const isExistFlashcard = await ClassroomModel.findOne(
      {
        _id: classroomId,
        subject: {
          $elemMatch: { flashcard: { $elemMatch: { title } } },
        },
      },
    );
    if (isExistFlashcard) {
      throw new ApolloError('Flashcard already exist');
    }

    const newFlashCard = {
      title,
      tag,
      subtitle,
      ressource
    }

    // On peut faire une projection sur l'objet crée mais pour avoir un objet imbirqué qu'on a crée comme dans ce cas il faudrait filtrer les résultat ...
    // https://stackoverflow.com/questions/54082166/mongoose-return-only-updated-item-using-findoneandupdate-and-array-filters

    try {
      const classroom = await ClassroomModel.findOneAndUpdate(
        { _id: classroomId, "subject.subjectId": subjectId },
        { $push: { 'subject.$.flashcard': newFlashCard } },
        {
          new: true,
          projection: 'subject',
        }
      )

      const updatedSubject = classroom.subject.filter((singleSubject: any) => singleSubject.subjectId === subjectId)[0];

      const createdFlashcard = updatedSubject.flashcard.filter((singleFlashcard: any) => singleFlashcard.title === title)[0]
      return createdFlashcard;
    }
    catch (error) {
      throw new ApolloError(
        'Could not create flashcard',
      );
    }
  }
}