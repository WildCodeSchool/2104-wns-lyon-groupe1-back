import mongoose from "mongoose";

const user = new mongoose.Schema({
    email: String,
    firstname: String,
    lastname: String,
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

const model : mongoose.Model<any>= mongoose.model("users", user);
export default model;