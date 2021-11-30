interface IParagraph {
  text: string;
  isValidated: boolean;
  isPublic: boolean;
  author: string;
  date: date;
}
interface ISubtitle {
  title: string;
  position: number;
  paragraph: IParagraph[];
}