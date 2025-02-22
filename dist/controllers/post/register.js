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
// auth-service/src/controllers/post/register.ts
const db_config_1 = require("../../db/db_config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Your existing schemas remain the same...
const baseUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, "First name must be at least 2 characters"),
    lastName: zod_1.z.string().min(2, "Last name must be at least 2 characters"),
    email: zod_1.z.string().email("Invalid email address"),
    phone: zod_1.z.string().regex(/^[0-9+\- ]+$/, "Invalid phone number format"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters")
        .regex(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, "Password must contain at least one uppercase letter, one number, and one special character"),
    gender: zod_1.z.enum(["male", "female", "other"]),
    dateOfBirth: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    role: zod_1.z.enum(["patient", "doctor"]),
});
const doctorSchema = baseUserSchema.extend({
    role: zod_1.z.literal("doctor"),
    specialization: zod_1.z.string().min(1, "Specialization is required"),
    licenseNumber: zod_1.z.string().min(1, "License number is required"),
});
const patientSchema = baseUserSchema.extend({
    role: zod_1.z.literal("patient"),
});
const userSchema = zod_1.z.discriminatedUnion("role", [
    patientSchema,
    doctorSchema,
]);
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate request body
        const result = userSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: result.error.issues[0].message
            });
        }
        const userData = result.data;
        // Check if user exists
        const { data: existingUser } = yield db_config_1.supabase
            .from('users')
            .select()
            .or(`email.eq.${userData.email},phone.eq.${userData.phone}`)
            .maybeSingle();
        if (existingUser) {
            return res.status(400).json({
                error: "A user with this email or phone number already exists"
            });
        }
        // Hash the password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(userData.password, salt);
        // Insert user with RLS bypass
        const { data: user, error: userError } = yield db_config_1.supabase
            .from('users')
            .insert({
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: userData.email,
            phone: userData.phone,
            password: hashedPassword,
            gender: userData.gender,
            date_of_birth: userData.dateOfBirth,
            role: userData.role,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
            .select()
            .single();
        if (userError) {
            console.error('Error creating user:', userError);
            return res.status(500).json({ error: "Error creating user account" });
        }
        // Create role-specific profile
        if (userData.role === 'doctor') {
            const { error: doctorError } = yield db_config_1.supabase
                .from('doctor_profiles')
                .insert({
                user_id: user.id,
                specialization: userData.specialization,
                license_number: userData.licenseNumber,
                verification_status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            if (doctorError) {
                console.error('Error creating doctor profile:', doctorError);
                // Delete the user if profile creation fails
                yield db_config_1.supabase.from('users').delete().eq('id', user.id);
                // Check for duplicate license number
                if (doctorError.code === '23505' && doctorError.message.includes('license_number')) {
                    return res.status(400).json({
                        error: "This license number is already registered. Please verify your credentials or contact support."
                    });
                }
                return res.status(500).json({ error: "Error creating doctor profile" });
            }
        }
        else {
            const { error: patientError } = yield db_config_1.supabase
                .from('patient_profiles')
                .insert({
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            if (patientError) {
                console.error('Error creating patient profile:', patientError);
                // Delete the user if profile creation fails
                yield db_config_1.supabase.from('users').delete().eq('id', user.id);
                return res.status(500).json({ error: "Error creating patient profile" });
            }
        }
        // Create JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            role: user.role,
            email: user.email
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        return res.status(201).json({
            message: "Registration successful! Please check your email to verify your account.",
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            error: "Registration failed. Please try again later."
        });
    }
});
// Helper function to send verification email
const sendVerificationEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    // Implement your email sending logic here
    console.log(`Verification email sent to ${email}`);
});
exports.default = register;
