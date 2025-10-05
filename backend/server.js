import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import passport from "passport";
import path from "path" // NEW: Import the 'path' module
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import auth from "./routes/auth.js";


dotenv.config();


import userRoutes from "./routes/userRoutes.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { startReminderScheduler } from "./utils/reminderScheduler.js";



const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// NEW: Serve static files from the parent directory (which contains frontend files)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '..')));

import './passport-config.js'; // This executes the passport configuration file
app.use(passport.initialize());

// --- Database Connection ---
const connectDB = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017");
        console.log('MongoDB Connected... ');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

connectDB();

// Routes
app.use("/api/user", userRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/analytics", analyticsRoutes);

// Start scheduler
startReminderScheduler();

// --- API Routes ---
app.get('/', (req, res) => res.send('API is running... ✨'));
app.use('/api/auth', auth);

// --- Start the Server ---
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));