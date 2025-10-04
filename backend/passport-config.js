// backend/passport-config.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // This is the new, improved logic
      const googleId = profile.id;
      const email = profile.emails[0].value;
      const name = profile.displayName;

      // 1. Check if a user already exists with this Google ID
      let user = await User.findOne({ googleId: googleId });

      if (user) {
        return done(null, user); // User found, log them in
      }

      // 2. If not, check if a user exists with this email
      user = await User.findOne({ email: email });

      if (user) {
        // User found via email, so this is a local account. Link it!
        user.googleId = googleId;
        await user.save();
        return done(null, user);
      }

      // 3. If no user exists at all, create a new one
      const newUser = new User({
        googleId: googleId,
        name: name,
        email: email
      });
      await newUser.save();
      return done(null, newUser);

    } catch (error) {
      return done(error, null);
    }
  }
));