import mongoose from "mongoose";
import {medicineSchema} from "./medicine.model.js";

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicines: { type: [medicineSchema], ref: "Medicine"},
  bio: { type: String },
  avatarUrl: { type: String },
});

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;