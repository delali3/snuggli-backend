// auth-service/src/controllers/post/login.ts
import { supabase } from "../../db/db_config";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import jwt from 'jsonwebtoken';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional()
});

const login = async (req: any, res: any) => {
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
    const { data: user, error: userError } = await supabase
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
    const isValidPassword = await bcryptjs.compare(password, user.password);
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
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: result.data.remember ? '7d' : '24h' }
    );

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
        profile: profileData ? {
          id: profileData.id,
          ...(user.role === 'doctor' ? {
            specialization: profileData.specialization,
            licenseNumber: profileData.license_number,
            verificationStatus: profileData.verification_status
          } : {})
        } : null
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: "Login failed. Please try again later." 
    });
  }
};

export default login;