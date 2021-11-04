import {
  Resolver,
  Arg,
  Mutation,
  Query,
  InputType,
  Field,
  ArgsType,
  Args,
  Ctx,
  ID
} from 'type-graphql';
import { ApolloError } from 'apollo-server-express';
import mongoose, { Aggregate } from 'mongoose';
import ClassroomModel from '../model/classroom';
import FlashcardModelGQL, {
  Ressource,
  Subtitle,
} from '../model/graphql/flashcardModelGQL';
import { ITokenContext } from '../utils/interface';



@ArgsType()
class CreateFlahscard implements Partial<FlashcardModelGQL>  {
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



@ArgsType()
class UpdateFlashcard implements Partial<FlashcardModelGQL> {
  @Field((type) => ID)
  classroomId!: string;

  @Field((type) => ID)
  subjectId!: string;

  @Field((type) => ID)
  flashcardId!: string;

  @Field((type) => String, { nullable: true })
  title: string | undefined;

  @Field((type) => [String], { nullable: true })
  tag: string[] | undefined;

  @Field((type) => [CreateSubtitle], { nullable: true })
  subtitle: CreateSubtitle[] | undefined;

  @Field((type) => [CreateRessource], { nullable: true })
  ressource: CreateRessource[] | undefined
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

@ArgsType()
class CreateFlahsCard implements Partial<FlashcardModelGQL> {
  @Field()
  classroomId!: string;

  @Field()
  subjectId!: string;

  @Field()
  title!: string;

  @Field(() => [String])
  tag!: string[];

  @Field(() => [CreateSubtitle])
  subtitle!: CreateSubtitle[];

  @Field(() => [CreateRessource])
  ressource!: CreateRessource[];
}

@Resolver(FlashcardModelGQL)
export default class FlashcardResolver {
  @Query(() => [FlashcardModelGQL])
  public async getAllFlashcards(
    @Arg('classroomId') classroomId: string,
    @Ctx() ctx: ITokenContext,
  ) {
    const { user } = ctx;
    console.log(user.id);
    const classroom = await ClassroomModel.findById(classroomId);

    if (!classroom) {
      throw new ApolloError('Classroom not found');
    }

    const allFlashcards = classroom.subject.reduce(
      (flashcards: any, subject: any) => {
        flashcards.push(...subject.flashcard);
        return flashcards;
      },
      [],
    );

    return allFlashcards.map((f: any) => {
      const flashcard = f;
      flashcard.subtitle = flashcard.subtitle.map((s: any) => {
        const subtitle = s;
        subtitle.paragraph = subtitle.paragraph.filter(
          (p: any) => p.author === user.id || p.isPublic === true,
        );
        return subtitle;
      });
      return flashcard;
    });
  }

  @Query(() => FlashcardModelGQL)
  public async getFlashcard(
    @Arg('flashcardId') flashcardId: string,
    @Arg('classroomId') classroomId: string,
    @Ctx() ctx: ITokenContext,
  ) {
    const { user } = ctx;
    console.log(user.id);

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

    const flashcard = classroom.subject[0].flashcard.filter(
      (f: any) => f._id.toString() === flashcardId,
    )[0];

    flashcard.subtitle = flashcard.subtitle.map((s: any) => {
      const subtitle = s;
      subtitle.paragraph = subtitle.paragraph.filter(
        (p: any) => p.author === user.id || p.isPublic === true,
      );
      return subtitle;
    });
    return flashcard;
  }

  // made for test and add quickly flashcard, return is not correct
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @Mutation(() => FlashcardModelGQL)
  public async createFlashcard(
    @Args()
    {
      classroomId,
      subjectId,
      title,
      ressource,
      tag,
      subtitle,
    }: CreateFlahsCard,
  ) {
    if (
      title === '' ||
      tag.length === 0 ||
      ressource.length === 0 ||
      subtitle.length === 0
    ) {
      throw new ApolloError(
        'title / tag / ressources / subtitles are required',
      );
    }

    // Check if flashcard is exist, if yes throw error otherwise continu
    const isExistFlashcard = await ClassroomModel.findOne({
      _id: classroomId,
      subject: {
        $elemMatch: { flashcard: { $elemMatch: { title } } },
      },
    });
    if (isExistFlashcard) {
      throw new ApolloError('Flashcard already exist');
    }

    const newFlashCard = {
      title,
      tag,
      subtitle,
      ressource,
    };

    // On peut faire une projection sur l'objet crée mais pour avoir un objet imbirqué qu'on a crée comme dans ce cas il faudrait filtrer les résultat ...
    // https://stackoverflow.com/questions/54082166/mongoose-return-only-updated-item-using-findoneandupdate-and-array-filters

    try {
      const classroom = await ClassroomModel.findOneAndUpdate(
        { _id: classroomId, 'subject.subjectId': subjectId },
        { $push: { 'subject.$.flashcard': newFlashCard } },
        {
          new: true,
          projection: 'subject',
        },
      );

      const updatedSubject = classroom.subject.filter(
        (singleSubject: any) => singleSubject.subjectId === subjectId,
      )[0];

      const createdFlashcard = updatedSubject.flashcard.filter(
        (singleFlashcard: any) => singleFlashcard.title === title,
      )[0];
      return createdFlashcard;
    } catch (error) {
      throw new ApolloError('Could not create flashcard');
    }
  }


  //  update flashcard by providing a valid flashcardId, classroomId, subjectId
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @Mutation((returns) => FlashcardModelGQL)
  public async updateFlashcard(
    @Args() {
      classroomId,
      subjectId,
      flashcardId,
      title,
      ressource,
      tag,
      subtitle
    }
      : UpdateFlashcard
  ) {

    try {
      const classroom = await ClassroomModel.findOne(
        {
          _id: classroomId,
        },
      )

      const subject = classroom.subject.find(
        (currentSubject: any) => currentSubject.subjectId == subjectId
      )

      const flashcard = subject.flashcard.find(
        (currentFlashcard: any) => currentFlashcard._id == flashcardId
      )

      title && (flashcard.title = title);
      ressource && (flashcard.ressource = ressource)
      tag && (flashcard.tag = tag)
      subtitle && (flashcard.subtitle = subtitle)

      await ClassroomModel.updateOne(classroom);

      return flashcard
    } catch (error) {
      throw new ApolloError("Error updating flashcard")
    }
  }
}

