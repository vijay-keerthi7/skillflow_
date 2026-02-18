import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // 1. Try to find user by googleId
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        return done(null, user);
      }

      // 2. If no googleId, check if a user exists with the same email
      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // Link the Google ID to the existing email account
        user.googleId = profile.id;
        if (!user.profilepic) user.profilepic = profile.photos[0].value;
        await user.save();
        return done(null, user);
      }

      // 3. If brand new user, create them
      const newUser = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        profilepic: profile.photos[0].value,
        isProfileComplete: false
      });

      return done(null, newUser);
    } catch (err) {
      return done(err, null);
    }
  }
));
