// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Each email must be unique
    },
    password: { type: String, required: false }, // Password is no longer required
    googleId: { type: String },
    token: {type : String}},
    { timestamps: true });


export default mongoose.model('User', UserSchema);