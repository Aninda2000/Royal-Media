import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User, IUser } from '../models/User';
import { generateHandle } from '../utils/auth-utils';
import { env } from './env';
import { createLogger } from '../utils/common';

const logger = createLogger('auth-service');

// Configure Google OAuth strategy
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with the same email
          user = await User.findOne({ email: profile.emails?.[0]?.value });

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            if (!user.providers.includes('google')) {
              user.providers.push('google');
            }
            user.emailVerified = true;
            await user.save();
            
            logger.info('Linked Google account to existing user', {
              userId: user._id,
              email: user.email,
            });
            
            return done(null, user);
          }

          // Create new user
          const firstName = profile.name?.givenName || 'User';
          const lastName = profile.name?.familyName || '';
          const email = profile.emails?.[0]?.value;
          
          if (!email) {
            return done(new Error('No email provided by Google'), null);
          }

          const handle = generateHandle(firstName, lastName);
          
          // Ensure handle is unique
          let uniqueHandle = handle;
          let counter = 1;
          while (await User.findOne({ handle: uniqueHandle })) {
            uniqueHandle = `${handle}${counter}`;
            counter++;
          }

          user = new User({
            email,
            firstName,
            lastName,
            handle: uniqueHandle,
            googleId: profile.id,
            providers: ['google'],
            avatarUrl: profile.photos?.[0]?.value,
            emailVerified: true,
            privacySettings: {
              profileVisibility: 'public',
              postsVisibility: 'public',
              friendsListVisible: true,
              allowFollowRequests: true,
              allowMessages: 'everyone',
            },
          });

          await user.save();

          logger.info('Created new user via Google OAuth', {
            userId: user._id,
            email: user.email,
            handle: user.handle,
          });

          return done(null, user);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;