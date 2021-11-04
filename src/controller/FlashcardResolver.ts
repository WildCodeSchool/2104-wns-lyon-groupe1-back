import { Resolver, Arg, Mutation, Query, InputType, Field, ArgsType, Args, ID } from 'type-graphql';
import { ApolloError } from 'apollo-server-express';
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
  paragraphId!: string;

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

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@


@Resolver(FlashcardModelGQL)
export default class FlashcardResolver {

  // Private method to get a classroom by providing its id
  //=================================================
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
  //=================================================
  private getSubjectById(classroom: any, subjectId: string) {
    const subject = classroom.subject.find(
      (currentSubject: any) => {
        return currentSubject._id == subjectId
      }
    )
    return subject;
  }

  //private method to get a flashcard by providing subject object and flashcard id
  //=================================================
  private getFlashcardById(subject: any, flashcardId: string) {
    const flashcard = subject.flashcard.find(
      (currentFlashcard: any) => {
        return currentFlashcard._id == flashcardId
      }
    )
    return flashcard;
  }

  //private method to get a flashcard by providing subject object and flashcard id
  //=================================================
  private getSubtitleById(flashcard: any, subtitleId: string) {
    const subtitle = flashcard.subtitle.find(
      (currentSubtitle: any) => {
        return currentSubtitle._id == subtitleId;
      }
    )
    return subtitle;
  }

  //private method to get a paragraph by providing its id and subtitle object
  //=================================================
  private getParagraphById(subtitle: any, paragraphId: string) {


    const paragrpah = subtitle.paragraph.find(
      (currentParagraph: any) => {
        return currentParagraph._id == paragraphId;
      }
    )
    return paragrpah
  }




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
      throw new ApolloError('Flashcard not found');
    }

    return classroom.subject[0].flashcard.filter(
      (f: any) => f._id.toString() === flashcardId,
    )[0];
  }

  // Create a flashcard
  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
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
      : CreateFlahscard
  ) {
    if (title === "" || tag.length === 0 || ressource.length === 0 || subtitle.length === 0) {
      throw new ApolloError(
        'title / tag / ressources / subtitles are required',
      );
    }


    // Check if flashcard is exist, if yes throw error otherwise continu
    const isExistFlashcard = await classroomModel.findOne(
      {
        _id: classroomId,
        subject: {
          $elemMatch: { flashcard: { $elemMatch: { title: title } } },
        },
      },
    );
    if (isExistFlashcard) {
      throw new ApolloError('Flashcard already exist');
    }

    const newFlashCard = {
      title: title,
      tag: tag,
      subtitle: subtitle,
      ressource: ressource
    }

    // On peut faire une projection sur l'objet crée mais pour avoir un objet imbirqué qu'on a crée comme dans ce cas il faudrait filtrer les résultat ...
    //https://stackoverflow.com/questions/54082166/mongoose-return-only-updated-item-using-findoneandupdate-and-array-filters

    try {
      const classroom = await classroomModel.findOneAndUpdate(
        { _id: classroomId, "subject.subjectId": subjectId },
        { $push: { 'subject.$.flashcard': newFlashCard } },
        {
          new: true,
          projection: 'subject',
        }
      )

      const updatedSubject = classroom.subject.filter((singleSubject: any) => {
        return singleSubject.subjectId == subjectId
      })[0];

      const createdFlashcard = updatedSubject.flashcard.filter((singleFlashcard: any) => {
        return singleFlashcard.title == title
      })[0]
      return createdFlashcard;
    }
    catch (error) {
      throw new ApolloError(
        'Could not create flashcard',
      );
    }
  }


  //  update flashcard by providing a valid flashcardId, classroomId, subjectId
  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
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

      await classroomModel.updateOne(classroom);

      return flashcard
    } catch (error) {
      throw new ApolloError("Error updating flashcard")
    }
  }


  //  Create a paragraph by providing, classroomId, subjectId, flashcardId, subtitleId, paragraph texx/author/ispublic
  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
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
        isValidate: false,
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

  // update a paragraph
  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @Mutation((returns) => FlashcardModelGQL)
  public async updateParagraph(
    @Arg('classroomId') classroomId: string,
    @Arg('subjectId') subjectId: string,
    @Arg('flashcardId') flashcardId: string,
    @Arg('subtitleId') subtitleId: string,
    @Arg('paragraph') paragraph: ParagraphInput
  ) {
    if (!paragraph.paragraphId) {
      throw new ApolloError("A paragraph _id should be provided");
    }

    try {
      const classroom = await this.getClassroomById(classroomId);
      const subject = this.getSubjectById(classroom, subjectId);
      const flashcard = this.getFlashcardById(subject, flashcardId);
      const subtitle = this.getSubtitleById(flashcard, subtitleId);
      const paragraphToUpdate = this.getParagraphById(subtitle, paragraph.paragraphId);

      //cannot update a paragraph if paragarph's authos is not paragraph's editor
      if (paragraph.author !== paragraphToUpdate.author) {
        throw new ApolloError("Could not update because not the same author")
      }

      paragraphToUpdate.text = paragraph.text;
      paragraphToUpdate.isValidate = false;
      paragraphToUpdate.date = getCurrentLocalDateParis();
      paragraphToUpdate.isPublic = paragraph.isPublic;

      await classroomModel.updateOne(classroom);
      return flashcard;
    }
    catch {
      throw new ApolloError("Couold not update paragraph")
    }
  }


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



  //C'étais dans la mutation de createFlashcard
  //============================================================
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

  //============================================================
