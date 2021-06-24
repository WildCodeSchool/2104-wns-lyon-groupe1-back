import mongoose from "mongoose";


const classrooms = new mongoose.Schema({
    name: String,
    year: String,
    student: [
        {
            firstname: String,
            lastname: String,
            email: String,
        }
    ],
    subject: [
        {
            flashcard: [
                {
                    title: String,
                    tag: [],
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


const model : mongoose.Model<any>= mongoose.model("classrooms", classrooms);
export default model
