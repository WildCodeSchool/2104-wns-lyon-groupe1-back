export interface iUserClassroom {
    classroomId : string,
    name : string,
    year : string
}


export interface iUser  {
    _id : string
    mail : string,
    firstname  : string,
    lastname  : string,
    password : string,
    token : string,
    isTeacher : boolean
    classroom : iUserClassroom
}
