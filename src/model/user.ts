import mongoose from "mongoose";

const user = new mongoose.Schema({
    lastname: String,
    mail: String,
    firstname: String,
    password: String,
    token: String,
    isTeacher: Boolean,
    classroom: [
        {
            classroomId : String,
            name  : String,
            year : String
        }
    ]

});