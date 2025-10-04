// models/User.js
const mongoose = require('mongoose');

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
    googleId: { type: String }},
    { timestamps: true });
module.exports = mongoose.model('User', UserSchema);