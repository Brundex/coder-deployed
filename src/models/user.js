import { Schema, model } from "mongoose";

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    rol: {
        type: String,
        default: "User"
    }
})

export const userModel = model("users", userSchema)