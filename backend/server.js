import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import passport from "passport";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

<<<<<<< HEAD
import userRoutes from "./routes/userRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import  startReminderScheduler  from "./utils/reminderScheduler.js";
import  startWhatsAppReminderScheduler  from "./utils/whatsappReminderScheduler.js";

=======
// --- Configuration ---
>>>>>>> 56219e9c453241e27e25a0e2fb378dc73a3efbab
const app = express();
const PORT = process.env.PORT || 5000;

// Resolve path variables for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Static File Serving Configuration (Frontend) ---

// 1. Define the path to the root of the frontend folder
const frontendPath = path.join(__dirname, "..", "frontend");

// 2. Middleware to serve the frontend files (HTML, JS, CSS, etc.) directly when requested by the browser
// This middleware is critical to resolving 'Cannot GET /login.html'.
app.use(express.static(frontendPath));

// 3. Middleware to specifically handle the 'assets' folder
// (Assuming your assets are in '../assets' or '../frontend/assets')
// We will explicitly map /assets to the correct location
app.use("/assets", express.static(path.join(__dirname, "..", "assets")));


// --- Middleware ---
app.use(cors());
app.use(express.json());

import "./passport-config.js"; // Executes the passport configuration file
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


// --- Route Imports (Must be imported after configuration) ---
import userRoutes from "./routes/userRoutes.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import auth from "./routes/auth.js";
import { startReminderScheduler } from "./utils/reminderScheduler.js";


// --- API Routes ---
app.use("/api/user", userRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/auth", auth);

// Start scheduler
startReminderScheduler();
startWhatsAppReminderScheduler();


// --- Default Route Handler ---
// If the user navigates to the root URL ('/'), serve the main entry point (index.html).
// This is typically the entry point for unauthenticated users.
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// IMPORTANT: No app.get('*', ...) or app.use('/...') outside of the defined API/static blocks.
// The express.static middleware handles all file requests, leaving the API routes undisturbed.


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
