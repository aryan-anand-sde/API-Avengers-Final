const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const path = require('path'); // NEW: Import the 'path' module
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// NEW: Serve static files from the parent directory (which contains frontend files)
app.use(express.static(path.join(__dirname, '..')));

require('./passport-config'); // This executes the passport configuration file
app.use(passport.initialize());

// --- Database Connection ---
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected... 🍃');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

connectDB();

// --- API Routes ---
app.get('/', (req, res) => res.send('API is running... ✨'));
app.use('/api/auth', require('./routes/auth'));

// --- Start the Server ---
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));