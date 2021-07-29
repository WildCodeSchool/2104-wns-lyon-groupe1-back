const mockClassroom = {
    _id: "61002b3c71e26e43e0afca6f",
    name: "dev1",
    year: "2012-2013",
    student: [
        {
            _id: "6102bee9d860d8a5ed680a31",
            mail: "eleve1@aca.com",
            firstname : "fsEleve1",
            lastname : "lsEleve1",
        },
        {
            _id: "6102bee9d860d8a5ed680a32",
            mail: "eleve2@aca.com",
            firstname : "fsEleve2",
            lastname : "lsEleve2",
        }
    ]
}

const mockStudent1 = {
    _id: "6102bee9d860d8a5ed680a31",
    mail: "eleve1@aca.com",
    firstname : "fsEleve1",
    lastname : "lsEleve1",
    classroom: [{
        name: mockClassroom.name,
        classroom_id: mockClassroom._id,
        year: mockClassroom.year
    }]
}

const mockStudent2 = {
    _id: "6102bee9d860d8a5ed680a32",
    mail: "eleve2@aca.com",
    firstname : "fsEleve2",
    lastname : "lsEleve2",
    classroom: [{
        name: mockClassroom.name,
        classroom_id: mockClassroom._id,
        year: mockClassroom.year
    }]
}

export {mockClassroom, mockStudent1, mockStudent2};
