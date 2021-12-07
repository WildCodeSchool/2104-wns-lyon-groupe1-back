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
  ID,
} from 'type-graphql';
import { ApolloError } from 'apollo-server-express';
import ClassroomModel from '../model/classroom';
import FlashcardModelGQL from '../model/graphql/flashcardModelGQL';
import {
  iFlashcard,
  iParagraph,
  iSubject,
  iSubtitle,
} from '../utils/types/classroomTypes';
import { ITokenContext } from '../utils/interface';

@InputType()
class RessourceInput {
  @Field()
  name!: string;

  @Field()
  url!: string;
}

@InputType()
class SubtitleInput {
  @Field(() => ID, { nullable: true })
  subtitleId?: string;

  @Field()
  title!: string;

  @Field()
  position!: number;
}

@ArgsType()
class CreateFlashcard {
  @Field(() => ID)
  classroomId!: string;

  @Field(() => ID)
  subjectId!: string;

  @Field()
  title!: string;

  @Field(() => [String], { nullable: true })
  tag?: string[];

  @Field(() => [SubtitleInput], { nullable: true })
  subtitle?: SubtitleInput[];

  @Field(() => [RessourceInput], { nullable: true })
  ressource?: RessourceInput[];
}

@ArgsType()
class UpdateFlashcard {
  @Field(() => ID)
  classroomId!: string;

  @Field(() => ID)
  subjectId!: string;

  @Field(() => ID)
  flashcardId!: string;

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => [String], { nullable: true })
  tag?: string[];

  @Field(() => [SubtitleInput], { nullable: true })
  subtitle?: SubtitleInput[];

  @Field(() => [RessourceInput], { nullable: true })
  ressource?: RessourceInput[];
}

@InputType()
class ParagraphInput {
  @Field(() => ID, { nullable: true })
  paragraphId?: string;

  @Field({ nullable: true })
  text?: string;

  @Field({ nullable: true })
  isPublic?: boolean;

  @Field({ nullable: true })
  isValidate?: boolean;
}

@ArgsType()
class UpdateFlashcardStudent {
  @Field(() => ID)
  classroomId!: string;

  @Field(() => ID)
  subjectId!: string;

  @Field(() => ID)
  flashcardId!: string;

  @Field(() => ID, { nullable: true })
  subtitleId?: string;

  @Field(() => ParagraphInput, { nullable: true })
  paragraph?: ParagraphInput;

  @Field({ nullable: true })
  ressource?: RessourceInput;
}

@Resolver(FlashcardModelGQL)
export default class FlashcardResolver {
  @Query(() => [FlashcardModelGQL])
  public async getAllFlashcards(
    @Arg('classroomId') classroomId: string,
    @Ctx() ctx: ITokenContext,
  ): Promise<iFlashcard[] | null> {
    const { user } = ctx;
    const classroom = await ClassroomModel.findById(classroomId);
    if (!classroom) {
      throw new ApolloError('Classroom not found');
    }

    const allFlashcards = classroom.subject.reduce(
      (flashcards: iFlashcard[], subject: iSubject) => {
        flashcards.push(...subject.flashcard);
        return flashcards;
      },
      [],
    );

    return allFlashcards.map((f: iFlashcard) => {
      const flashcard = f;
      flashcard.subtitle = flashcard.subtitle.map((s: iSubtitle) => {
        const subtitle = s;
        subtitle.paragraph = subtitle.paragraph.filter(
          (p: iParagraph) => p.author === user.id || p.isPublic === true,
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
  ): Promise<iFlashcard | null> {
    const { user } = ctx;
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
      (f: iFlashcard) => f._id?.toString() === flashcardId,
    )[0];

    flashcard.subtitle = flashcard.subtitle.map((s: iSubtitle) => {
      const subtitle = s;
      subtitle.paragraph = subtitle.paragraph.filter(
        (p: iParagraph) => p.author === user.id || p.isPublic === true,
      );
      return subtitle;
    });
    return flashcard;
  }

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
    }: CreateFlashcard,
  ): Promise<iFlashcard | null> {
    if (!title.length) {
      throw new ApolloError('Title is required');
    }

    // Check if flashcard with same title is exist, if yes throw error otherwise continu
    const isExistFlashcard = await ClassroomModel.findOne({
      _id: classroomId,
      subject: {
        $elemMatch: { subjectId, flashcard: { $elemMatch: { title } } },
      },
    });
    if (isExistFlashcard) {
      throw new ApolloError('Title Flashcard already exists');
    }
    const newSubtitle: Array<{ [key: string]: string | number}> = [];

    subtitle?.forEach((sub, index) => {
      newSubtitle.push({
        title: sub.title,
        position: index,
      });
    });

    const newFlashCard = {
      title,
      tag,
      subtitle: newSubtitle,
      ressource,
    };

    try {
      const classroom = await ClassroomModel.findOneAndUpdate(
        { _id: classroomId, subject: { $elemMatch: { subjectId } } },
        { $push: { 'subject.$.flashcard': newFlashCard } },
        {
          new: true,
          projection: { subject: { $elemMatch: { subjectId } } },
        },
      );

      return (
        classroom?.subject[0].flashcard.filter((f) => f.title === title)[0] ||
        null
      );
    } catch (error) {
      throw new ApolloError('Could not create flashcard');
    }
  }

  @Mutation(() => FlashcardModelGQL)
  public async updateFlashcard(
    @Args()
    {
      classroomId,
      subjectId,
      flashcardId,
      title,
      ressource,
      tag,
      subtitle,
    }: UpdateFlashcard,
  ): Promise<iFlashcard | null> {
    const updQuery: {
      [key: string]: { [key: string]: string | string[] | unknown };
    } = {
      $push: {},
      $set: {
        ...(title ? { 'subject.$[s].flashcard.$[f].title': title } : {}),
        ...(ressource
          ? { 'subject.$[s].flashcard.$[f].ressource': ressource }
          : {}),
        ...(tag ? { 'subject.$[s].flashcard.$[f].tag': tag } : {}),
      },
    };
    const filters: Array<{ [key: string]: string }> = [
      { 's._id': subjectId },
      { 'f._id': flashcardId },
    ];

   const newSubtitle: Array<{ [key: string]: string | number}> = [];

    subtitle?.forEach((sub, index) => {
      newSubtitle.push({
        title: sub.title,
        position: index,
      });
    });

    if (newSubtitle.length) {
      updQuery.$set[`subject.$[s].flashcard.$[f].subtitle`] =  newSubtitle;
    }
    try {
      const classroom = await ClassroomModel.findOneAndUpdate(
        {
          _id: classroomId,
        },
        {
          ...updQuery,
        },
        {
          new: true,
          upsert: true,
          arrayFilters: [...filters],
          projection: {
            subject: { $elemMatch: { _id: subjectId } },
          },
        },
      );

      if (!classroom) {
        throw new Error('Classroom not found');
      }
      return (
        classroom.subject[0].flashcard.filter(
          (f) => f._id?.toString() === flashcardId,
        )[0] || null
      );
    } catch (e: any) {
      throw new ApolloError(e?.message || 'Could not update flashcard');
    }
  }

  @Mutation(() => FlashcardModelGQL)
  public async updateFlashcardStudent(
    @Args()
    {
      classroomId,
      subjectId,
      flashcardId,
      subtitleId,
      paragraph,
      ressource,
    }: UpdateFlashcardStudent,
    @Ctx() ctx: ITokenContext,
  ): Promise<iFlashcard | null> {
    const { user } = ctx;

    if (paragraph && !subtitleId) {
      throw new ApolloError('SubtitleId is required for paragraph action');
    }

    const filters: Array<{ [key: string]: string }> = [
      { 'sub._id': subjectId },
      { 'flash._id': flashcardId },
      { 'subt._id': subtitleId || '' },
    ];
    const updQuery: {
      [key: string]: { [key: string]: string | string[] | unknown };
    } = { $set: {}, $push: {} };

    if (paragraph?.paragraphId) {
      updQuery.$set[
        'subject.$[sub].flashcard.$[flash].subtitle.$[subt].paragraph.$[par].isPublic'
      ] = paragraph.isPublic ?? true;

      if ('isValidate' in paragraph) {
        updQuery.$set[
          'subject.$[sub].flashcard.$[flash].subtitle.$[subt].paragraph.$[par].isValidate'
        ] = paragraph.isValidate;
      }

      if ('text' in paragraph) {
        updQuery.$set[
          'subject.$[sub].flashcard.$[flash].subtitle.$[subt].paragraph.$[par].text'
        ] = paragraph.text;
        updQuery.$set[
          'subject.$[sub].flashcard.$[flash].subtitle.$[subt].paragraph.$[par].author'
        ] = user.id;
        updQuery.$set[
          'subject.$[sub].flashcard.$[flash].subtitle.$[subt].paragraph.$[par].isValidate'
        ] = false;
      }

      filters.push({ 'par._id': paragraph.paragraphId });
    } else {
      if (paragraph) {
        updQuery.$push[
          'subject.$[sub].flashcard.$[flash].subtitle.$[subt].paragraph'
        ] = {
          text: paragraph.text,
          isPublic: paragraph.isPublic || true,
          author: user.id,
          isValidate: false,
          date: Date.now(),
        };
      }

      if (ressource) {
        updQuery.$push['subject.$[sub].flashcard.$[flash].ressource'] = {
          name: ressource.name,
          url: ressource.url,
        };
      }
    }

    try {
      const classroom = await ClassroomModel.findOneAndUpdate(
        {
          _id: classroomId,
        },
        {
          ...updQuery,
        },
        {
          new: true,
          upsert: true,
          arrayFilters: [...filters],
        },
      );

      if (!classroom) {
        throw new Error('Classroom not found');
      }
      const flash = classroom.subject
        .find((s) => s._id?.toString() === subjectId)
        ?.flashcard.find((f) => f._id?.toString() === flashcardId);

      if (!flash) {
        throw new Error('Flashcard not found');
      }

      flash.subtitle.map((s) => {
        const subtitle = s;
        subtitle.paragraph = subtitle.paragraph.filter(
          (p: iParagraph) => p.author === user.id || p.isPublic === true,
        );
        return subtitle;
      });
      return flash;
    } catch (e: any) {
      throw new ApolloError(e?.message || 'Could not update flashcard');
    }
  }
}
