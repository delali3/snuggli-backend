// auth-service/src/controllers/get/profile.ts
import { Request, Response } from 'express';
import { supabase } from "../../db/db_config";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email: string;
  };
}

const getProfile = async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        gender,
        date_of_birth,
        role,
        status,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    // Get role-specific profile data
    let profileData = null;
    if (userRole === 'doctor') {
      const { data: doctorProfile, error: doctorError } = await supabase
        .from('doctor_profiles')
        .select(`
          id,
          specialization,
          license_number,
          verification_status,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .single();

      if (doctorError) {
        console.error('Error fetching doctor profile:', doctorError);
        return res.status(500).json({ error: 'Error fetching doctor profile' });
      }

      profileData = doctorProfile;
    } else {
      const { data: patientProfile, error: patientError } = await supabase
        .from('patient_profiles')
        .select(`
          id,
          allergies,
          medical_history,
          current_medications,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .single();

      if (patientError) {
        console.error('Error fetching patient profile:', patientError);
        return res.status(500).json({ error: 'Error fetching patient profile' });
      }

      profileData = patientProfile;
    }

    // Return combined user and profile data
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        gender: user.gender,
        dateOfBirth: user.date_of_birth,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      profile: profileData
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ 
      error: "Failed to fetch profile data. Please try again later." 
    });
  }
};

export default getProfile;