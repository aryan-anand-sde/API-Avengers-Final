import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import User from "../models/User.js";
// Assuming you have an auth middleware file
import authMiddleware from "../middleware/auth.js"; 

const router = express.Router();
<<<<<<< HEAD
=======
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const crypto = require('crypto');
const nodemailer = require('nodemailer'); 
const User = require('../models/User');
const path = require('path');
>>>>>>> origin/main

// --- SIGN UP ROUTE ---
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }
        
        const verificationToken = crypto.randomBytes(20).toString('hex');

        user = new User({
            name,
            email,
            password,
            verificationToken: verificationToken,
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const transporter = nodemailer.createTransport({
            host: "smtp.sendgrid.net", port: 587,
            auth: { user: "apikey", pass: process.env.SENDGRID_API_KEY },
        });
        
        const verificationURL = `http://localhost:5000/api/auth/verify/${verificationToken}`;
        
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: user.email,
            subject: 'Verify Your Email for Alchemist\'s Grimoire',
            text: `Thank you for registering! Please click the following link to verify your email address:\n\n${verificationURL}`,
        });

        res.status(201).json({ msg: 'Registration successful. Please check your email to verify your account.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// --- SIGN IN ROUTE ---
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user || !user.password) {
            return res.status(400).json({ msg: 'Invalid Credentials or please sign in with Google.' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ msg: 'Please verify your email before logging in.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
        res.json({ token });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// --- EMAIL VERIFICATION ROUTE ---
router.get('/verify/:token', async (req, res) => {
    try {
        const user = await User.findOne({ verificationToken: req.params.token });
        if (!user) {
            return res.status(400).send('<h1>Invalid or expired verification token.</h1>');
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.redirect('/verification-success.html');

    } catch (err) {
        console.error(err.message);
        res.status(500).send('<h1>Server Error during verification.</h1>');
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
<<<<<<< HEAD
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
=======
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/auth.html', session: false }), (req, res) => {
    const payload = { user: { id: req.user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
    const isNewUser = (new Date() - req.user.createdAt) < 2000;
    res.redirect(`/auth.html?token=${token}&isNewUser=${isNewUser}`);
});

// --- FORGOT PASSWORD ROUTE ---
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ msg: 'If an account with that email exists, a password reset link has been sent.' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const transporter = nodemailer.createTransport({
            host: "smtp.sendgrid.net",
            port: 587,
            auth: {
                user: "apikey",
                pass: process.env.SENDGRID_API_KEY,
            },
        });
        
        const resetURL = `http://localhost:5000/reset-password.html?token=${token}`;
        
        const mailOptions = {
            from: process.env.FROM_EMAIL,
            to: user.email,
            subject: 'Password Reset for Alchemist\'s Grimoire',
            text: `You are receiving this because you have requested the reset of the password for your account.\n\n` +
                  `Please click on the following link to complete the process:\n\n` +
                  `${resetURL}\n\n` +
                  `If you did not request this, please ignore this email.\n`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ msg: 'If an account with that email exists, a password reset link has been sent.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// --- RESET PASSWORD ROUTE ---
router.post('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ msg: 'Password reset token is invalid or has expired.' });
        }

        const { password } = req.body;
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ msg: 'Your password has been successfully updated.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});
>>>>>>> origin/main

export default router;