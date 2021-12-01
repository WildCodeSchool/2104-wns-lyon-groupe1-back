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
import ClassroomModel from '../model/classroom';
import { ITokenContext } from '../utils/interface';
import FlashcardModelGQL, { Paragraph, Ressource, Subtitle } from '../model/graphql/flashcardModelGQL';
import { iClassroom, iFlashcard, iParagraph, iSubject, iSubtitle } from '../utils/types/classroomTypes';

@InputType()
class RessourceInput extends Ressource {
  @Field()
  name!: string;

  @Field()
  url!: string;
}

@InputType()
class SubtitleInput extends Subtitle {

  @Field({ nullable: true })
  subtitleId!: string;

  @Field()
  title!: string;

  @Field()
  position!: number;
}


@ArgsType()
class CreateFlashcard implements Partial<FlashcardModelGQL>  {
  @Field()
  classroomId!: string;

  @Field()
  subjectId!: string;

  @Field()
  title!: string;

  @Field(() => [String])
  tag!: string[];

  @Field(() => [SubtitleInput])
  subtitle!: SubtitleInput[];

  @Field(() => [RessourceInput])
  ressource!: RessourceInput[];
}



@ArgsType()
class UpdateFlashcard implements Partial<FlashcardModelGQL> {
  @Field(() => ID)
  classroomId!: string;

  @Field(() => ID)
  subjectId!: string;

  @Field(() => ID)
  flashcardId!: string;

  @Field(() => String, { nullable: true })
  title: string | undefined;

  @Field(() => [String], { nullable: true })
  tag: string[] | undefined;

  @Field(() => [SubtitleInput], { nullable: true })
  subtitle: SubtitleInput[] | undefined;

  @Field(() => [RessourceInput], { nullable: true })
  ressource: RessourceInput[] | undefined
}


@InputType()
class ParagraphInput implements Partial<Paragraph> {

  @Field(() => ID, { nullable: true })
  paragraphId: string | undefined;

  @Field({ nullable: true })
  text!: string;

  @Field({ nullable: true })
  isPublic!: boolean;


  // is validate can be nullable because it might not be provided in case we want to simply update or create a paragraph, but it should be provided to validate a paragarph
  @Field({ nullable: true })
  isValidate!: boolean;
}


@ArgsType()
class CreateParagraph extends FlashcardModelGQL {

  @Field(() => ID)
  classroomId!: string;

  @Field(() => ID)
  subjectId!: string;

  @Field(() => ID)
  flashcardId!: string;

  @Field(() => ID)
  subtitleId!: string

  @Field(() => ParagraphInput)
  paragraph!: ParagraphInput;
}






// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@


@Resolver(FlashcardModelGQL)
export default class FlashcardResolver {

  // Private method to get a classroom by providing its id
  // =================================================
  private async getClassroomById(classroomId: string): Promise<iClassroom | null> {
    try {
      const classroom = await ClassroomModel.findOne({ _id: classroomId });
      return classroom;
    }
    catch {
      throw new ApolloError("cannot find classroom")
    }
  }

  // private method to get subject located in a classroom by providing classroom object and subjectId
  // =================================================
  private getSubjectById(classroom: iClassroom, subjectId: string): iSubject | undefined {
    const subject = classroom.subject.find(
      (currentSubject: iSubject) => currentSubject.subjectId.toString() === subjectId
    )
    return subject
  }

  // private method to get a flashcard by providing subject object and flashcard id
  // =================================================
  private getFlashcardById(subject: iSubject, flashcardId: string): iFlashcard | undefined {
    const flashcard = subject.flashcard.find(
      (currentFlashcard: iFlashcard) => currentFlashcard._id?.toString() === flashcardId
    )
    return flashcard;
  }

  // private method to get a flashcard by providing subject object and flashcard id
  // =================================================
  private getSubtitleById(flashcard: iFlashcard, subtitleId: string): iSubtitle | undefined {
    const subtitle = flashcard.subtitle.find(
      (currentSubtitle: iSubtitle) => currentSubtitle._id?.toString() === subtitleId
    )
    return subtitle;
  }

  // private method to get a paragraph by providing its id and subtitle object
  // =================================================
  private getParagraphById(subtitle: iSubtitle, paragraphId: string): iParagraph | undefined {
    const paragrpah = subtitle.paragraph.find(
      (currentParagraph: iParagraph) => currentParagraph._id?.toString() === paragraphId
    )
    return paragrpah
  }

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

  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @Query(() => FlashcardModelGQL)
  public async getFlashcard(
    @Arg('flashcardId') flashcardId: string,
    @Arg('classroomId') classroomId: string,
    @Ctx() ctx: ITokenContext,
  ) : Promise<iFlashcard | null> {
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

  // Create a flashcard
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  // Create a flashcard
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  @Mutation(() => FlashcardModelGQL)
  public async createFlashcard(
    @Args() {
      classroomId,
      subjectId,
      title,
      ressource,
      tag,
      subtitle
    }
      : CreateFlashcard
  ): Promise<iFlashcard | null> {
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


      const updatedSubject = classroom && classroom.subject.filter((singleSubject: any) => singleSubject.subjectId === subjectId)[0];
      const createdFlashcard = updatedSubject && updatedSubject.flashcard.filter((singleFlashcard: any) => singleFlashcard.title === title)[0]
      return createdFlashcard;
    }
    catch (error) {
      throw new ApolloError(
        'Could not create flashcard',
      );
    }
  }


  //  update flashcard by providing a valid flashcardId, classroomId, subjectId
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @Mutation(() => FlashcardModelGQL)
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
  ): Promise<iFlashcard | null> {


    let classroom: any;

    try {
      classroom = await this.getClassroomById(classroomId);
    }
    catch {
      throw new ApolloError("Could not get classroom");
    }

    const subject = this.getSubjectById(classroom, subjectId);
    const flashcard = subject && this.getFlashcardById(subject, flashcardId);

    const modifyExistingSubtitle = (givenSubtitle: SubtitleInput): iSubtitle => {
      const subtitleToUpdate = flashcard && this.getSubtitleById(flashcard, givenSubtitle.subtitleId);
      if (subtitleToUpdate) {
        subtitleToUpdate.title = givenSubtitle.title
        subtitleToUpdate.position = givenSubtitle.position
        return subtitleToUpdate;
      }
      // if no subtitleToUpdate then return the givenSubtitel
      return givenSubtitle
    }

    const isValidSubtitlesPosition = (subtitles: iSubtitle[]): boolean => {
      const seen = new Set();
      const hasDublicates = subtitles.some((singleSubtitle) => seen.size === seen.add(singleSubtitle.position).size)
      return hasDublicates;
    }

    if (!flashcard) {
      throw new ApolloError("No flashcard match");
    }

    if (title) {
      flashcard.title = title
    }
    if (ressource) {
      flashcard.ressource = ressource
    }
    if (tag) {
      flashcard.tag = tag
    }
    // we will check if some subtitle has subtitleId attribute, if yes then modify them without changing their paragraphs otherwise create them
    if (subtitle) {
      const updatedSubtitle: iSubtitle[] = [];
      subtitle.filter((singleSubtitle: SubtitleInput) => {
        if (singleSubtitle.subtitleId) {
          updatedSubtitle.push(modifyExistingSubtitle(singleSubtitle));
        }
        else {
          updatedSubtitle.push(singleSubtitle);
        }
        return updatedSubtitle;
      })

      if (isValidSubtitlesPosition(updatedSubtitle)) {
        throw new ApolloError("Cannot have the same position more than one time");
      }
      else {
        flashcard.subtitle = updatedSubtitle;
      }
    }
    try {
      await ClassroomModel.updateOne(classroom);
      return flashcard;
    }
    catch {
      throw new ApolloError("ERROR cannot update flashcard paragraphs")
    }
  }



  // UPDATE flashcard paragraph by providing a paragraph id or CREATE a new paragraph if no paragraph id is provided
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @Mutation(() => FlashcardModelGQL)
  // TODO paragraph author
  public async updateFlashcardParagraph(
    @Args() {
      classroomId,
      subjectId,
      flashcardId,
      subtitleId,
      paragraph
    }
      : CreateParagraph
  ): Promise<iFlashcard | null> {


    const classroom: any = await this.getClassroomById(classroomId);
    const subject = classroom && this.getSubjectById(classroom, subjectId);
    const flashcard = subject && this.getFlashcardById(subject, flashcardId);
    const subtitle = flashcard && this.getSubtitleById(flashcard, subtitleId);


    // if no paragraph.id is provided then create a new paragraph
    if (!paragraph.paragraphId && subtitle) {
      if (!paragraph.text) {
        throw new ApolloError("Paragraph text is required")
      }
      else {
        const createdParagraph = {
          text: paragraph.text,
          isValidate: false, // => paragraph is not validated by default
          isPublic: (paragraph.isPublic !== undefined) ? paragraph.isPublic : true, // => paragraph is public by default
          author: "REPLACE BY USER ID",
          // TODO author = userid stored in context
          // author: paragraph.author, 
          date: new Date()
        }
        subtitle.paragraph = subtitle.paragraph.push(createdParagraph);
        try {
          await ClassroomModel.updateOne(classroom);
          return flashcard;
        }
        catch {
          throw new ApolloError("Could not create a new paragraph")
        }
      }
    }

    // if a paragraph id is provided then update the existing paragraph
    else if (paragraph.paragraphId) {
      const paragraphToUpdate: any = this.getParagraphById(subtitle, paragraph.paragraphId);

      // if there is only isValidate in paragraph object then it switch ti validate true
      // TODO check user here, if the same use who created the paragraph then do not validate
      if (Object.keys(paragraph).length === 2 && paragraph.isValidate !== undefined) {
        paragraphToUpdate.isValidate = paragraph.isValidate;
      }
      else {
        if (paragraph.text) {
          paragraphToUpdate.text = paragraph.text
        }
        paragraphToUpdate.isValidate = false; // => upon updated paragraph become !validated
        paragraphToUpdate.date = new Date();
        paragraphToUpdate.isPublic = paragraph.isPublic || true
      }
      try {
        await ClassroomModel.updateOne(classroom);
        return flashcard;
      }

      catch {
        throw new ApolloError("Could not update paragraph")
      }
    }
    return flashcard;
  }
}