// auth-service/src/controllers/post/register.ts
import { supabase } from "../../db/db_config";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import jwt from 'jsonwebtoken';

// Your existing schemas remain the same...
const baseUserSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[0-9+\- ]+$/, "Invalid phone number format"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
      "Password must contain at least one uppercase letter, one number, and one special character"
    ),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  role: z.enum(["patient", "doctor"]),
});

const doctorSchema = baseUserSchema.extend({
  role: z.literal("doctor"),
  specialization: z.string().min(1, "Specialization is required"),
  licenseNumber: z.string().min(1, "License number is required"),
});

const patientSchema = baseUserSchema.extend({
  role: z.literal("patient"),
});

const userSchema = z.discriminatedUnion("role", [
  patientSchema,
  doctorSchema,
]);

const register = async (req: any, res: any) => {
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
    const { data: existingUser } = await supabase
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
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(userData.password, salt);

    // Insert user with RLS bypass
    const { data: user, error: userError } = await supabase
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
      const { error: doctorError } = await supabase
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
        await supabase.from('users').delete().eq('id', user.id);

        // Check for duplicate license number
        if (doctorError.code === '23505' && doctorError.message.includes('license_number')) {
          return res.status(400).json({ 
            error: "This license number is already registered. Please verify your credentials or contact support." 
          });
        }

        return res.status(500).json({ error: "Error creating doctor profile" });
      }
    } else {
      const { error: patientError } = await supabase
        .from('patient_profiles')
        .insert({
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (patientError) {
        console.error('Error creating patient profile:', patientError);
        // Delete the user if profile creation fails
        await supabase.from('users').delete().eq('id', user.id);
        return res.status(500).json({ error: "Error creating patient profile" });
      }
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

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

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: "Registration failed. Please try again later." 
    });
  }
};

// Helper function to send verification email
const sendVerificationEmail = async (email: string) => {
  // Implement your email sending logic here
  console.log(`Verification email sent to ${email}`);
};

export default register;
