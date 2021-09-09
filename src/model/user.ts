import mongoose from "mongoose";

const user = new mongoose.Schema({
    mail: {type : String, unique : true},
    firstname: String,
    lastname: String,
    password: String,
    token: String,
    isTeacher: {type : Boolean, default : false},
    classroom: [
        {
            classroomId : String,
            name  : String,
            year : String
        }
    ]
});

const model : mongoose.Model<any>= mongoose.model("users", user);
export default model;