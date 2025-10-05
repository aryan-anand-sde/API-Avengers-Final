// models/User.js
// import Medicine from "./medicineModel";
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
    medId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
    password: { type: String, required: false }, // Password is no longer required
    googleId: { type: String },
    token: {type : String}},
    { timestamps: true });


export default mongoose.model('User', UserSchema);