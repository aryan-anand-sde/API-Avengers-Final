<<<<<<< HEAD
// models/User.js
// import Medicine from "./medicineModel";
import mongoose from "mongoose";
=======
const mongoose = require('mongoose');
>>>>>>> origin/main

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
<<<<<<< HEAD
    medId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
    password: { type: String, required: false }, // Password is no longer required
    googleId: { type: String },
    token: {type : String}},
    { timestamps: true });


export default mongoose.model('User', UserSchema);
=======
    password: {
        type: String,
        required: false,
    },
    googleId: {
        type: String,
    },
    // ✅ NEW FIELDS FOR PASSWORD RESET
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
>>>>>>> origin/main
