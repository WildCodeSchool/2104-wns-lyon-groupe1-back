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
  @Field()
  text!: string;

  @Field()
  isPublic!: boolean;

  @Field()
  author!: string;
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




@ArgsType()
class UpdateParagraph extends FlashcardModelGQL {
  @Field((type) => ID)
  classroomId!: string;

  @Field((type) => ID)
  subjectId!: string;

  @Field((type) => ID)
  flashcardId!: string;

  @Field((type) => ID)
  subtitleId!: string

  @Field((type) => [ParagraphInput])
  paragraph!: ParagraphInput[];
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

    try {
      const classroom = await this.getClassroomById(classroomId);
      const subject = this.getSubjectById(classroom, subjectId);
      const flashcard = this.getFlashcardById(subject, flashcardId);
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


  //  Create a paragraph by providing, classroomId, subjectId, flashcardId, subtitleId, paragraph texx/author/ispublic
  // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @Mutation((returns) => FlashcardModelGQL)
  public async createParagraph(
    @Args() {
      classroomId,
      subjectId,
      flashcardId,
      subtitleId,
      paragraph
    }
      : CreateParagraph
  ) {

    try {
      const classroom = await this.getClassroomById(classroomId);
      const subject = this.getSubjectById(classroom, subjectId);
      const flashcard = this.getFlashcardById(subject, flashcardId);
      const subtitle = this.getSubtitleById(flashcard, subtitleId);

      const createdParagraph = {
        text: paragraph.text,
        isValidated: false,
        isPublic: paragraph.isPublic,
        author: paragraph.author,
        date: getCurrentLocalDateParis()
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
  
      
    
    } */


  /*   @Mutation((returns) => FlashcardModelGQL)
    public async updateFlashcardParagraph(
      @Arg('classroomId') classroomId: string,
      @Arg('subjectId') subjectId : string,    
      @Arg('flashcardId') flashcardId: string,
      @Arg('paragraph') paragraph : Paragraph
    ) {
    } */
}

/* {
  "subtitle_id" : [ { "paragraph_id" : "545",  "text" : "Update", "isPublic" : true}, { "paragraph_id" : "545",  "text" : "New", "isPublic" : true} ]
  } */



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
