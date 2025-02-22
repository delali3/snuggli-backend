import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import admin from "./routes/admin";
import general from "./routes/general";
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

const startServer = async () => {
  try {
    // Middleware
    app.use(express.json());
    app.use(morgan("dev"));
    app.use(helmet({ 
      crossOriginResourcePolicy: { policy: "cross-origin" },
      // Add these to ensure CORS works with helmet
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }));
    app.use(cookieParser());

    // CORS Configuration
    const allowedOrigins = [
      "https://snuggli-2-orchidhelpdesk.replit.app",
      process.env.FRONTEND_URL,
    ];

    app.use(cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("CORS policy does not allow this origin"), false);
      },
      credentials: true
    }));

    // Session configuration
    app.use(
      session({
        secret: process.env.AUTH_SESSION_SECRET ?? "secret",
        resave: false,
        saveUninitialized: false,
        cookie: { 
          secure: process.env.NODE_ENV === 'production', // Only use secure in production
          httpOnly: true, 
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
        }
      })
    );

    // Passport initialization
    app.use(passport.initialize());
    app.use(passport.session());

    // Routes
    app.use("/api", general);
    app.use("/admin/api", admin);

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Something broke!' });
    });

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

startServer().catch(console.error);