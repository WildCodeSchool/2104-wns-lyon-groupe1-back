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
import { ITokenContext } from '../utils/interface';
import classroomModel from '../model/classroom';
import FlashcardModelGQL, { Paragraph, Ressource, Subtitle } from '../model/graphql/flashcardModelGQL';
import getCurrentLocalDateParis from '../utils/getCurrentLocalDateParis';




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

  @Field((type) => [SubtitleInput])
  subtitle!: SubtitleInput[];

  @Field((type) => [RessourceInput])
  ressource!: RessourceInput[];
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

  @Field((type) => [SubtitleInput], { nullable: true })
  subtitle: SubtitleInput[] | undefined;

  @Field((type) => [RessourceInput], { nullable: true })
  ressource: RessourceInput[] | undefined
}


@InputType()
class ParagraphInput implements Partial<Paragraph> {

  @Field((type) => ID, { nullable: true })
  paragraphId: string | undefined;

  @Field({ nullable: true })
  text!: string;

  @Field({ nullable: true })
  isPublic!: boolean;


  //is validate can be nullable because it might not be provided in case we want to simply update or create a paragraph, but it should be provided to validate a paragarph
  @Field({ nullable: true })
  isValidate!: boolean;
  //TODO delete if tested and not needed
  /* 
    @Field()
    author!: string; */
}


@ArgsType()
class CreateParagraph extends FlashcardModelGQL {

  @Field((type) => ID)
  classroomId!: string;

  @Field((type) => ID)
  subjectId!: string;

  @Field((type) => ID)
  flashcardId!: string;

  @Field((type) => ID)
  subtitleId!: string

  @Field((type) => ParagraphInput)
  paragraph!: ParagraphInput;
}





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
// {{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}
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


// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@


@Resolver(FlashcardModelGQL)
export default class FlashcardResolver {

  // Private method to get a classroom by providing its id
  //= ================================================
  private async getClassroomById(classroomId: string) {
    try {
      const classroom = await classroomModel.findOne({ _id: classroomId });
      return classroom
    }
    catch {
      throw new ApolloError("cannot find classroom")
    }
  }

  // private method to get subject located in a classroom by providing classroom object and subjectId
  //= ================================================
  private getSubjectById(classroom: any, subjectId: string) {
    const subject = classroom.subject.find(
      (currentSubject: any) => currentSubject._id == subjectId
    )
    return subject;
  }

  // private method to get a flashcard by providing subject object and flashcard id
  //= ================================================
  private getFlashcardById(subject: any, flashcardId: string) {
    const flashcard = subject.flashcard.find(
      (currentFlashcard: any) => currentFlashcard._id == flashcardId
    )
    return flashcard;
  }

  // private method to get a flashcard by providing subject object and flashcard id
  //= ================================================
  private getSubtitleById(flashcard: any, subtitleId: string) {
    const subtitle = flashcard.subtitle.find(
      (currentSubtitle: any) => currentSubtitle._id == subtitleId
    )
    return subtitle;
  }

  // private method to get a paragraph by providing its id and subtitle object
  //= ================================================
  private getParagraphById(subtitle: any, paragraphId: string) {
    const paragrpah = subtitle.paragraph.find(
      (currentParagraph: any) => currentParagraph._id == paragraphId
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

  // Create a flashcard
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @Mutation((returns) => FlashcardModelGQL)
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


    let classroom;

    try {
      classroom = await this.getClassroomById(classroomId);
    }
    catch {
      throw new ApolloError("Could not get classroom");
    }

    const subject = this.getSubjectById(classroom, subjectId);
    const flashcard = this.getFlashcardById(subject, flashcardId);
    title && (flashcard.title = title);
    ressource && (flashcard.ressource = ressource)
    tag && (flashcard.tag = tag)

    const modifyExistingSubtitle = (subtitle: SubtitleInput): Subtitle => {
      const subtitleToUpdate: Subtitle = this.getSubtitleById(flashcard, subtitle.subtitleId);
      subtitleToUpdate.title = subtitle.title
      subtitleToUpdate.position = subtitle.position
      return subtitleToUpdate;
    }

    const isValidSubtitlesPosition = (subtitles: Subtitle[]): boolean => {
      let seen = new Set();
      const hasDublicates = subtitles.some((subtitle) => {
        return seen.size === seen.add(subtitle.position).size;
      })
      return hasDublicates;
    }

    //we will check if some subtitle has subtitleId attribute, if yes then modify them without changing their paragraphs otherwise create them
    if (subtitle) {
      const updatedSubtitle: Subtitle | any = [];
      subtitle.filter((singleSubtitle: SubtitleInput) => {
        if (singleSubtitle.subtitleId) {
          updatedSubtitle.push(modifyExistingSubtitle(singleSubtitle));
        }
        else {
          updatedSubtitle.push(singleSubtitle);
        }
      })

      if (isValidSubtitlesPosition(updatedSubtitle)) {
        throw new ApolloError("Cannot have the same position more than one time");
      }
      else {
        flashcard.subtitle = updatedSubtitle;
      }
    }

    try {
      await classroomModel.updateOne(classroom);
      return flashcard

    }
    catch {
      throw new ApolloError("ERROR cannot update flashcard paragraphs")
    }
  }


  //UPDATE flashcard paragraph by providing a paragraph id or CREATE a new paragraph if no paragraph id is provided
  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @Mutation((returns) => FlashcardModelGQL)
  //TODO paragraph author
  public async updateFlashcardParagraph(
    @Args() {
      classroomId,
      subjectId,
      flashcardId,
      subtitleId,
      paragraph
    }
      : CreateParagraph
  ) {


    const classroom = await this.getClassroomById(classroomId);
    const subject = this.getSubjectById(classroom, subjectId);
    const flashcard = this.getFlashcardById(subject, flashcardId);
    const subtitle = this.getSubtitleById(flashcard, subtitleId);


    //if no paragraph.id is provided then create a new paragraph
    if (!paragraph.paragraphId) {
      if (!paragraph.text) {
        throw new ApolloError("Paragraph text is required")
      }
      subtitle.paragraph = subtitle.paragraph.push(createdParagraph);
      await classroomModel.updateOne(classroom);

      return flashcard;
    }
    catch {
      throw new ApolloError("Could not create a new paragraph")
    }
  }





  //  update a paragraph by providing 
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  /*   @Mutation((returns) => FlashcardModelGQL)
    public async updateParagraph(
      @Args() {
        classroomId,
        subjectId,
        flashcardId,
        subtitleId,
        paragraph
      }
        : UpdateParagraph
    ) {
  
  
      const classroom = await this.getClassroomById(classroomId);
      const subject = this.getSubjectById(classroom, subjectId);
      const flashcard = this.getFlashcardById(subject, flashcardId);
      const subtitle = this.getSubtitleById(flashcard, subtitleId);
      const paragraphToUpdate = this.getParagraphById(subtitle, paragraph.paragraphId);

      //cannot update a paragraph if paragarph's authos is not paragraph's editor
      if (paragraph.author !== paragraphToUpdate.author) {
        throw new ApolloError("Could not update because not the same author")
      }
      catch {
        throw new ApolloError("Could not create a new paragraph")
      }
    }

    //if a paragraph id is provided then update the existing paragraph
    else if (paragraph.paragraphId) {
      const paragraphToUpdate = this.getParagraphById(subtitle, paragraph.paragraphId);

      //if there is only isValidate in paragraph object then it switch ti validate true
      //TODO check user here, if the same use who created the paragraph then do not validate
      if (Object.keys(paragraph).length === 2 && paragraph.isValidate !== undefined && paragraph.paragraphId) {
        paragraphToUpdate.isValidate = paragraph.isValidate;
      }
      else {
        paragraph.text && (paragraphToUpdate.text = paragraph.text);
        paragraphToUpdate.isValidate = false; //=> upon updated paragraph become !validated
        paragraphToUpdate.date = getCurrentLocalDateParis();
        paragraph.isPublic !== undefined ? (paragraphToUpdate.isPublic = paragraph.isPublic) : (paragraphToUpdate.isPublic = true)
      }
      try {
        await classroomModel.updateOne(classroom);
        return flashcard;
      }

      catch {
        throw new ApolloError("Could not update paragraph")
      }
    }
  }
  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@



  // C'étais dans la mutation de createFlashcard
  //= ===========================================================
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

  //= ===========================================================
