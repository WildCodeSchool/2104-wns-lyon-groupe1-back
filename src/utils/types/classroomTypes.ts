export interface iParagraph {
  _id?: string;
  text: string;
  isValidate: boolean;
  isPublic: boolean;
  author: string;
  date: Date;
}

export interface iRessource {
  id: string;
  name: string;
  url: string;
}

export interface iSubtitle {
  _id: string;
  title: string;
  position: number;
  paragraph: iParagraph[];
}

export interface iAnswer {
  text: string;
  author: string;
  date: Date;
}

export interface iQuestion {
  text: string;
  answer: iAnswer[];
  date: Date;
  author: string;
  isPublic: boolean;
}

export interface iFlashcard {
  _id?: string;
  subjectId?: string;
  title: string;
  tag: string[];
  dateLastAnswer?: string;
  subtitle: iSubtitle[];
  ressource: iRessource[];
  question: iQuestion[];
}

export interface iSubject {
  _id: string;
  subjectId: string;
  flashcard: iFlashcard[];
}

export interface iStudent {
  firstname: string;
  lastname: string;
  mail: string;
  userId: string;
}

export interface iClassroom {
  _id?: string;
  name: string;
  year: string;
  student: iStudent[];
  subject: iSubject[];
}
