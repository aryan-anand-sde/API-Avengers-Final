import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  dosage: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  times: {
    type: [String], // e.g. ["09:00 AM", "08:30 PM"]
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
}, { timestamps: true }); // adds createdAt and updatedAt

export default mongoose.model("Reminder", reminderSchema);
