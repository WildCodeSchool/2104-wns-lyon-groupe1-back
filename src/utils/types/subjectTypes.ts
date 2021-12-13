import { iFlashcard } from './classroomTypes';

export interface iSubject {
  _id: string;
  imageUrl: string;
  name: string;
  flashcards: iFlashcard[];
}
