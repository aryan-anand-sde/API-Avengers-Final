const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const path = require('path'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));
require('./passport-config'); 
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
app.use('/api/auth', require('./routes/auth'));

// The problematic app.get('*', ...) line has been REMOVED from here.
// express.static will now handle all frontend file requests.

// --- Start the Server ---
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));