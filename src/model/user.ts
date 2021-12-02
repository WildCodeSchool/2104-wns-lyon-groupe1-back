import mongoose from "mongoose";
import { iUser } from "../utils/types/userTypes";

const user = new mongoose.Schema<iUser>({
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

const model : mongoose.Model<iUser>= mongoose.model("users", user);
export default model;