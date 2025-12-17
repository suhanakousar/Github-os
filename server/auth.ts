import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import type { Express } from "express";
import session from "express-session";
import { storage } from "./storage";

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || "http://localhost:3457/api/auth/github/callback";

// Configure session
export function setupSession(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (error) {
      done(error, null);
    }
  });

  // Configure GitHub OAuth strategy
  if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: GITHUB_CLIENT_ID,
          clientSecret: GITHUB_CLIENT_SECRET,
          callbackURL: GITHUB_CALLBACK_URL,
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            // Find or create user
            let user = await storage.getUserByUsername(profile.username);
            
            if (!user) {
              user = await storage.createUser({
                username: profile.username,
                password: "", // No password for OAuth users
              });
            }

            // Store GitHub token and profile in the user object for session
            const userWithToken = {
              ...user,
              githubToken: accessToken,
              githubProfile: profile,
            };

            return done(null, userWithToken);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  }
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

// Get GitHub token from session
export function getGitHubToken(req: Request): string | null {
  const session = req.session as any;
  if (session?.githubToken) {
    return session.githubToken;
  }
  if (req.user && (req.user as any).githubToken) {
    return (req.user as any).githubToken;
  }
  return process.env.GITHUB_TOKEN || null;
}

