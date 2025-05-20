import { Session, SessionOptions } from "express-session";
import passport from "passport";
import { Strategy as JwtStrategy } from "passport-jwt";

const sessionConfig: SessionOptions = {
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

const jwtConfig: process.env.JWT_SECRET || "jwt-secret-key",
  jwtFromRequest: (req: unknown)  = {
  secretOrKey> req.cookies?.jwt,
};

export { sessionConfig, jwtConfig };
