// models/User.js
// import Medicine from "./medicineModel";
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    medId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
    token: { type: String },
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
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
