// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Loads environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable express to parse JSON bodies in requests

// --- Database Connection ---
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected... 🍃');
    } catch (err) {
        console.error(err.message);
        process.exit(1); // Exit process with failure
    }
};

connectDB();

// --- API Routes ---
app.get('/', (req, res) => res.send('API is running... ✨'));
app.use('/api/auth', require('./routes/auth')); // Use our auth routes

// --- Start the Server ---
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));