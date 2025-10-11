import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import passport from "passport";
import path from "path"; // NEW: Import the 'path' module
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import auth from "./routes/auth.js";

dotenv.config();

import userRoutes from "./routes/userRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import  startReminderScheduler  from "./utils/reminderScheduler.js";
import  startWhatsAppReminderScheduler  from "./utils/whatsappReminderScheduler.js";

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
// NEW: Serve static files from the parent directory (which contains frontend files)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "..")));

import "./passport-config.js"; // This executes the passport configuration file
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/assets", express.static(path.join(__dirname, "../assets")));
app.use(passport.initialize());

// Process-level handlers: log unhandled rejections/exceptions so server doesn't crash silently
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  // In production you might want to exit the process and let a supervisor restart it.
  // For development here, log it to avoid nodemon-restarts for ValidationError noise.
  console.error('Uncaught Exception:', err);
});

// --- Database Connection ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected... ");
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
startWhatsAppReminderScheduler();

// --- API Routes ---
app.get("/", (req, res) => res.send("API is running... ✨"));
app.use("/api/auth", auth);

// The problematic app.get('*', ...) line has been REMOVED from here.
// express.static will now handle all frontend file requests.

// The problematic app.get('*', ...) line has been REMOVED from here.
// express.static will now handle all frontend file requests.

// --- Start the Server ---
app.listen(PORT, () =>
  console.log(`Server started on http://localhost:${PORT}`)
);

// Global Express error handler (must be added after all routes)
app.use((err, req, res, next) => {
  if (!err) return next();

  // Mongoose validation errors -> 400
  if (err.name === 'ValidationError') {
    console.warn('Validation error caught by global handler:', err);
    const errors = Object.keys(err.errors || {}).reduce((acc, k) => {
      acc[k] = err.errors[k].message || err.errors[k].kind || true;
      return acc;
    }, {});
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  // Other errors -> 500
  console.error('Unhandled error in request pipeline:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});
