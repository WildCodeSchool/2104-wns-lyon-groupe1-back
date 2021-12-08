import mongoose from "mongoose";
import { iClassroom } from "../utils/types/classroomTypes";


const classrooms = new mongoose.Schema<iClassroom>({
    name: String,
    year: String,
    student: [
        {
            firstname: String,
            lastname: String,
            mail: String,
            userId: String,
        }
    ],
    subject: [
        {
            subjectId: String,
            flashcard: [
                {
                    title: String,
                    tag: [String],
                    subtitle: [
                        {
                            title: String,
                            position: Number,
                            paragraph: [
                                {
                                    text: String,
                                    isValidate: Boolean,
                                    isPublic: Boolean,
                                    author: String,
                                    date: Date
                                }
                            ]
                        },
                    ],
                    ressource: [
                        {
                            name: String,
                            url: String
                        }
                    ],
                    question: [
                        {
                            text: String,
                            answer: [
                                {
                                    text: String,
                                    author: String,
                                    date: Date
                                }
                            ],
                            date: Date,
                            author: String,
                            isPublic: Boolean
                        }
                    ]
                }
            ]
        }
    ]
});


const model : mongoose.Model<iClassroom>= mongoose.model("classrooms", classrooms);
export default model
