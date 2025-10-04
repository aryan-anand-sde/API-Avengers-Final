import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  dosage: { type: String, required: true },
  duration: { type: String, required: true },
  frequency: { type: String, required: true },
  status: { type: String, enum: ['taken', 'missed', 'active'], default: 'active' },
  description: { type: String },
  sideEffects: { type: String },
});

const Medicine = mongoose.model("Medicine", medicineSchema);

export {Medicine, medicineSchema};
