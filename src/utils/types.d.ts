interface ISubtitle {
    title  : string,
    position : number,
    paragraph : IParagraph[]
}

interface IParagraph {
    text : string,
    isValidated : boolean,
    isPublic : boolean,
    author : string,
    date : date
}

