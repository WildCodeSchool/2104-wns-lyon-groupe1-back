export interface iUserClassroom {
    classroomId : string,
    name : string,
    year : string
}


export interface iUser  {
    mail : string,
    firstname  : string,
    lastname  : string,
    password : string,
    token : string,
    isTeacher : boolean
    classroom : iUserClassroom
}
