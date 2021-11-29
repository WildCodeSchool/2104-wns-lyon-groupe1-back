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
        return currentSubject.subjectId == subjectId
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

    //TODO inorder to update a flashcard subtitle without deleteing its content we should also considerate using the id so we only change the text
    //TODO when subtitle is modified, do not delete paragraphs inside it
    try {
      const classroom = await this.getClassroomById(classroomId);
      const subject = this.getSubjectById(classroom, subjectId);
      const flashcard = this.getFlashcardById(subject, flashcardId);
      title && (flashcard.title = title);
      ressource && (flashcard.ressource = ressource)
      tag && (flashcard.tag = tag)


      const modifyExistingSubtitle = (subtitle: SubtitleInput): Subtitle => {
        const subtitleToUpdate: Subtitle = this.getSubtitleById(flashcard, subtitle.subtitleId);
        subtitle.title && (subtitleToUpdate.title = subtitle.title);
        subtitle.position && (subtitleToUpdate.position = subtitle.position);
        return subtitleToUpdate;
      }

      //we will check if some subtitle has subtitleId attribute, if yes then modify them without changing their paragraphs otherwise create them
      if (subtitle) {
        const updatedSubtitle : any = [];
        subtitle.filter((singleSubtitle: SubtitleInput) => {
          if (singleSubtitle.subtitleId) {
            updatedSubtitle.push(modifyExistingSubtitle(singleSubtitle));
          }
          else {
            updatedSubtitle.push(singleSubtitle);
          }
        })
        flashcard.subtitle = updatedSubtitle;
      }
      await classroomModel.updateOne(classroom);

      return flashcard
    } catch (error) {
      throw new ApolloError("Error updating flashcard")
    }
  }


  //UPDATE flashcard paragraph by providing a paragraph id or CREATE a new paragraph if no paragraph id is provided
  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  //=======================================================
  // if an id is provided wuthout a text then there we will an error because text will be deleted
  //=======================================================
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

    if (Object.keys(paragraph).length === 2 && paragraph.paragraphId && paragraph.isValidate !== undefined) {
      //TODO check also if author and validator are not the same person
      const paragraphToUpdate = this.getParagraphById(subtitle, paragraph.paragraphId);
      paragraphToUpdate.isValidate = paragraph.isValidate
      try {
        await classroomModel.updateOne(classroom);
        return flashcard;
      }
      catch {
        throw new ApolloError("Could not validate paragarph")
      }
    }

    //if no paragraph.id is provided then create a new paragraph
    else if (!paragraph.paragraphId) {
      const createdParagraph = {
        text: paragraph.text,
        isValidate: false,
        isPublic: (paragraph.isPublic !== undefined) ? paragraph.isPublic : true,
        //TODO author = userid stored in context
        // author: paragraph.author, 
        date: getCurrentLocalDateParis()
      }
      subtitle.paragraph = subtitle.paragraph.push(createdParagraph);
      try {
        await classroomModel.updateOne(classroom);
        return flashcard;
      }
      catch {
        throw new ApolloError("Could not create a new paragraph")
      }
    }

    //if a paragraph id is provided then update the paragraph
    else if (paragraph.paragraphId) {
      const paragraphToUpdate = this.getParagraphById(subtitle, paragraph.paragraphId);
      paragraphToUpdate.text !== undefined ? (paragraphToUpdate.text = paragraph.text) : " ";
      paragraphToUpdate.isValidate = false;
      paragraphToUpdate.date = getCurrentLocalDateParis();
      paragraph.isPublic !== undefined ? (paragraphToUpdate.isPublic = paragraph.isPublic) : (paragraphToUpdate.isPublic = true)

      try {
        await classroomModel.updateOne(classroom);
        return flashcard;
      }

      catch {
        throw new ApolloError("Could not update paragraph")
      }
    }
  }



  //TODO paragrpah validation 
  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

}


/* subtitle: [
  {
    title: "new first subtitle"
    position: 1
  },
  {
    title : "new second subtitle"
    position : 2
  }
] */