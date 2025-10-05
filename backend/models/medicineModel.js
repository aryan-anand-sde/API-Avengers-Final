import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  dosage: String,
  time: String,
  email: String,
  taken: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Medicine", medicineSchema);
