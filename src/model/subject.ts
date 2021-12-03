import mongoose from "mongoose";
import { iSubject } from "../utils/types/classroomTypes";

const subjects = new mongoose.Schema<iSubject>({
    name : String,
    imageUrl : String,    
});

const model : mongoose.Model<iSubject> = mongoose.model("subjects", subjects);
export default model;