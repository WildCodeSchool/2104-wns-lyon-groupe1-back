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

@InputType()
class QuestionInput {
  @Field()
  text!: string;
}

@InputType()
class AnswerInput {
  @Field(() => ID)
  questionId!: string;

  @Field()
  text!: string;
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

  @Field({ nullable: true })
  question?: QuestionInput;

  @Field({ nullable: true })
  answer?: AnswerInput;
}

@Resolver(FlashcardModelGQL)
export default class FlashcardResolver {
  @Query(() => [FlashcardModelGQL])
  public async getAllFlashcards(
    @Arg('classroomId') classroomId: string,
    @Arg('tag', (type) => [String], { nullable: true }) tag: string[],
    @Ctx() ctx: ITokenContext,
  ): Promise<iFlashcard[] | null> {
    const { user } = ctx;
    const classroom = await ClassroomModel.findById(classroomId);
    if (!classroom) {
      throw new ApolloError('Classroom not found');
    }

    const allFlashcards = classroom.subject.reduce(
      (flashcards: iFlashcard[], subject: iSubject) => {
        let flashes: iFlashcard[] = [];
        if (tag) {
          tag.forEach((t: string) => {
            flashes = flashes.concat(
              subject.flashcard.filter((f: iFlashcard) =>
                f.tag.includes(t.trim()),
              ),
            );
          });
        } else {
          flashes = subject.flashcard;
        }
        flashes = flashes.map((f) => {
          const newFlash = f;
          newFlash.subjectId = subject._id;
          return newFlash;
        });
        flashcards.push(...flashes);
        return flashcards;
      },
      [],
    );

    return [...new Set(allFlashcards)].map((f: iFlashcard) => {
      const flashcard = f;
      flashcard.subtitle = flashcard.subtitle.map((s: iSubtitle) => {
        const subtitle = s;
        subtitle.paragraph = subtitle.paragraph.filter(
          (p: iParagraph) => p.author === user.id || p.isPublic === true,
        );
        return subtitle;
      });
      let allDates = flashcard.question.reduce((dates: Date[], question) => {
        const answerDate = question.answer.map((a) => a.date);
        dates.push(...answerDate);
        return dates;
      }, []);
      allDates = [...new Set(allDates.sort((a, b) => (a < b ? 1 : -1)))];
      flashcard.dateLastAnswer = allDates[0]?.toISOString();
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
      ['subject._id', 'subject.flashcard.$'],
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
    flashcard.subjectId = classroom.subject[0]._id;
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
    @Ctx() ctx: ITokenContext,
  ): Promise<iFlashcard | null> {
    const { user } = ctx;

    if (!user.isTeacher) {
      throw new ApolloError('You are not a teacher');
    }

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
    const newSubtitle: Array<{ [key: string]: string | number }> = [];

    subtitle?.forEach((sub, index) => {
      newSubtitle.push({
        title: sub.title,
        position: index,
      });
    });

    try {
      const newFlashCard = {
        title,
        tag,
        subtitle: newSubtitle,
        ressource,
      };

      let filterOptions; // will be dynamically changed, depends on if subject does exist or not
      let pushOptions; // will be dynamically changed, depends on if subject does exist or not

      // Check if subject does exist in classroom
      const isExistSubject = await ClassroomModel.findOne({
        _id: classroomId,
        subject: { $elemMatch: { subjectId } },
      });

      // if subject does exist in the classroom then add to it the newly created flashcard
      if (isExistSubject) {
        filterOptions = {
          _id: classroomId,
          subject: { $elemMatch: { subjectId } },
        };
        pushOptions = { 'subject.$.flashcard': newFlashCard };
      }

      // if subject does exist in the classroom then create a new subject object with the receivec subjectId
      if (!isExistSubject) {
        const newSubject = {
          subjectId,
          flashcard: [newFlashCard],
        };

        filterOptions = { _id: classroomId };
        pushOptions = { subject: newSubject };
      }

      const classroom = await ClassroomModel.findOneAndUpdate(
        filterOptions,
        { $push: pushOptions },
        {
          new: true,
          projection: { subject: { $elemMatch: { subjectId } } },
        },
      );
      if (!classroom) {
        throw new Error('Error update');
      }
      const subId = classroom.subject[0]._id;
      const flashcard = classroom.subject[0].flashcard.filter(
        (f) => f.title === title,
      )[0];
      if (!flashcard) {
        throw new Error('Error update');
      }
      flashcard.subjectId = subId;
      return flashcard;
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
    @Ctx() ctx: ITokenContext,
  ): Promise<iFlashcard | null> {
    const { user } = ctx;

    if (!user.isTeacher) {
      throw new ApolloError('You are not a teacher');
    }

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

    const newSubtitle: Array<{
      [key: string]: string | number | iParagraph[];
    }> = [];

    const existingSubtitle = subtitle?.reduce((id: string[], sub) => {
      if (sub.subtitleId) {
        id.push(sub.subtitleId);
      }
      return id;
    }, []);
    const existingParagraph: { [key: string]: iParagraph[] } = {};
    if (existingSubtitle?.length) {
      try {
        const classroom = await ClassroomModel.findOne(
          {
            _id: classroomId,
            subject: {
              $elemMatch: { flashcard: { $elemMatch: { _id: flashcardId } } },
            },
          },
          ['subject.flashcard.$'],
        );
        classroom?.subject[0].flashcard
          .filter((f) => f._id?.toString() === flashcardId)[0]
          .subtitle.filter((s) =>
            existingSubtitle.includes(s._id?.toString() || ''),
          )
          .forEach((s) => {
            existingParagraph[s._id] = s.paragraph;
          });
      } catch (e) {
        throw new ApolloError('Subtitle not found');
      }
    }
    subtitle?.forEach((sub, index) => {
      newSubtitle.push({
        title: sub.title,
        position: index,
        paragraph: sub.subtitleId ? existingParagraph[sub.subtitleId] : [],
      });
    });
    if (newSubtitle.length) {
      updQuery.$set[`subject.$[s].flashcard.$[f].subtitle`] = newSubtitle;
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
      question,
      answer,
    }: UpdateFlashcardStudent,
    @Ctx() ctx: ITokenContext,
  ): Promise<iFlashcard | null> {
    const { user } = ctx;

    if (user.isTeacher) {
      throw new ApolloError('You are not a student');
    }

    if (paragraph && !subtitleId) {
      throw new ApolloError('SubtitleId is required for paragraph action');
    }

    const filters: Array<{ [key: string]: string }> = [
      { 'sub._id': subjectId },
      { 'flash._id': flashcardId },
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

      filters.push(
        { 'par._id': paragraph.paragraphId },
        { 'subt._id': subtitleId || '' },
      );
    } else if (paragraph && paragraph.text) {
      updQuery.$push[
        'subject.$[sub].flashcard.$[flash].subtitle.$[subt].paragraph'
      ] = {
        text: paragraph.text || '',
        isPublic: paragraph?.isPublic || true,
        author: user.id,
        isValidate: false,
        date: Date.now(),
      };
      filters.push({ 'subt._id': subtitleId || '' });
    }

    if (ressource) {
      updQuery.$push['subject.$[sub].flashcard.$[flash].ressource'] = {
        name: ressource.name,
        url: ressource.url,
      };
    }

    if (question) {
      updQuery.$push['subject.$[sub].flashcard.$[flash].question'] = {
        text: question.text,
        date: Date.now(),
        author: user.id,
      };
    }

    if (answer) {
      updQuery.$push[
        'subject.$[sub].flashcard.$[flash].question.$[question].answer'
      ] = {
        text: answer.text,
        date: Date.now(),
        author: user.id,
      };

      filters.push({ 'question._id': answer.questionId });
    }
    console.log(updQuery);
    console.log(filters);
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
