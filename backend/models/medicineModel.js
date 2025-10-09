import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    dosage: {
        type: String,
        required: true
    },
    // MODIFIED: Changed from 'time: String' to 'times: [String]'
    times: {
        type: [String], // This defines an array of strings
        required: true
    },
    email: {
        type: String,
        required: true
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});

export default mongoose.model("Medicine", medicineSchema);