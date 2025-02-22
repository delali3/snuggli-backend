"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const passport_1 = __importDefault(require("passport"));
const admin_1 = __importDefault(require("./routes/admin"));
const general_1 = __importDefault(require("./routes/general"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000', 10);
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Middleware
        app.use(express_1.default.json());
        app.use((0, morgan_1.default)("dev"));
        app.use((0, helmet_1.default)({
            crossOriginResourcePolicy: { policy: "cross-origin" },
            // Add these to ensure CORS works with helmet
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: false,
        }));
        app.use((0, cookie_parser_1.default)());
        // CORS Configuration
        const allowedOrigins = [
            "https://snuggli-2-orchidhelpdesk.replit.app",
            process.env.FRONTEND_URL,
        ];
        app.use((0, cors_1.default)({
            origin: function (origin, callback) {
                if (!origin || allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                return callback(new Error("CORS policy does not allow this origin"), false);
            },
            credentials: true
        }));
        // Session configuration
        app.use((0, express_session_1.default)({
            secret: (_a = process.env.AUTH_SESSION_SECRET) !== null && _a !== void 0 ? _a : "secret",
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production', // Only use secure in production
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24, // 24 hours
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
            }
        }));
        // Passport initialization
        app.use(passport_1.default.initialize());
        app.use(passport_1.default.session());
        // Routes
        app.use("/api", general_1.default);
        app.use("/admin/api", admin_1.default);
        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({ error: 'Something broke!' });
        });
        // Start server
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start the server:", error);
        process.exit(1);
    }
});
startServer().catch(console.error);
