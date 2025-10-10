// backend/models/Adherence.js

import mongoose from 'mongoose'; // FIX: Changed require to import

const AdherenceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: true,
    },
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine', // Links to the main Medicine document
        required: true,
    },
    scheduledDate: {
        type: String, // Store as YYYY-MM-DD string for easy querying
        required: true,
    },
    scheduledTime: {
        type: String, // Store as HH:MM AM/PM string, e.g., "9:35 PM"
        required: true,
    },
    status: {
        type: String,
        enum: ['taken', 'missed'], // Enforce valid status values
        default: 'missed',
        required: true,
    },
    recordedAt: {
        type: Date,
        default: Date.now,
    },
}, { 
    timestamps: true 
});

// Ensures that only one status record exists per dose per day for a user
AdherenceSchema.index({ userId: 1, medicineId: 1, scheduledDate: 1, scheduledTime: 1 }, { unique: true });

// Export the model using the ES Module syntax
export default mongoose.model('Adherence', AdherenceSchema);