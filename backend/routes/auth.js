import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import User from "../models/User.js";
// Assuming you have an auth middleware file
import authMiddleware from "../middleware/auth.js"; 

const router = express.Router();

// --- SIGN UP ROUTE ---
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }
        user = new User({ name, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- SIGN IN ROUTE ---
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        if (!user.password) {
            return res.status(400).json({ msg: 'That email is associated with a Google account. Please sign in with Google.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ------------------------------------
// --- NEW ROUTE TO GET USER PROFILE ---
// ------------------------------------
// Endpoint: POST /api/user/me
// Description: Get user profile using a token sent in the request body.
router.post('/me', authMiddleware, async (req, res) => {
    try {
        // The user ID is added to req.user by the authMiddleware
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
             return res.status(404).json({ msg: 'User not found' });
        }

        // Return only the necessary profile details
        res.json({
            name: user.name,
            email: user.email,
            // NOTE: The frontend code expects `user.token` but the token itself 
            // is not a property of the User model. Returning the user ID here 
            // as a placeholder for confirmation. You should adjust the frontend 
            // if you don't need the token echoed back.
            id: user.id 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// --- GOOGLE OAUTH ROUTES ---
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        const payload = { user: { id: req.user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

        const isNewUser = (new Date() - req.user.createdAt) < 2000;

        // ✅ CORRECTED PATH: Add '/frontend' to the redirect URL
        res.redirect(`http://127.0.0.1:5500/frontend/auth.html?token=${token}&isNewUser=${isNewUser}`);
    }
);

export default router;