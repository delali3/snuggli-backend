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
// auth-service/src/controllers/post/login.ts
const db_config_1 = require("../../db/db_config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Validation schema for login
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
    remember: zod_1.z.boolean().optional()
});
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate request body
        const result = loginSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: result.error.issues[0].message
            });
        }
        const { email, password } = result.data;
        // Fetch user with their role-specific profile
        const { data: user, error: userError } = yield db_config_1.supabase
            .from('users')
            .select(`
        *,
        doctor_profiles (*),
        patient_profiles (*)
      `)
            .eq('email', email)
            .maybeSingle();
        if (userError) {
            console.error('Database error:', userError);
            return res.status(500).json({ error: "Login failed. Please try again." });
        }
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        // Verify password
        const isValidPassword = yield bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        // Check if account is verified/active
        if (user.status !== 'active') {
            return res.status(403).json({
                error: "Please verify your email address to login",
                status: user.status
            });
        }
        // Create JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            role: user.role,
            email: user.email
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: result.data.remember ? '7d' : '24h' });
        // Prepare profile data based on role
        const profileData = user.role === 'doctor'
            ? user.doctor_profiles[0]
            : user.patient_profiles[0];
        // Return success response with user data
        return res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                profile: profileData ? Object.assign({ id: profileData.id }, (user.role === 'doctor' ? {
                    specialization: profileData.specialization,
                    licenseNumber: profileData.license_number,
                    verificationStatus: profileData.verification_status
                } : {})) : null
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            error: "Login failed. Please try again later."
        });
    }
});
exports.default = login;
