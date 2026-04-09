import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { env } from './env.js';
import { prisma } from '../lib/prisma.js';

export function configurePassport(): void {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/v1/auth/google/callback',
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done,
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found in Google profile'));
          }

          const existingUser = await prisma.user.findUnique({
            where: { googleId: profile.id },
          });

          if (existingUser) {
            return done(null, existingUser);
          }

          const newUser = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || email.split('@')[0],
              avatarUrl: profile.photos?.[0]?.value || null,
              googleId: profile.id,
            },
          });

          return done(null, newUser);
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );
}
