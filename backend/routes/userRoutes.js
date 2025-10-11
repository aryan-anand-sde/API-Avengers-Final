import express from "express";
import User from "../models/User.js"; // Assuming your User model is imported
import auth from "../middleware/auth.js"; // Import the auth middleware

const router = express.Router();

// NOTE: Add other authentication routes (login/register) here if they belong to /api/auth

// @desc    Get authenticated user data (used for profile display)
// @route   GET /api/auth/me
// @access  Private
// The 'auth' middleware validates the token from the header and populates req.user.id
router.get("/me", auth, async (req, res) => {
    try {
        // Fetch the user using the ID decoded from the token payload
        // .select("-password") prevents sending the hashed password to the client
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return the user data as JSON
        res.json(user);

    } catch (err) {
        console.error(err.message);
        // This is a server error, not an authentication failure (which auth middleware handles)
        res.status(500).json({ message: "Server Error: Profile load failed." });
    }
});

export default router;
