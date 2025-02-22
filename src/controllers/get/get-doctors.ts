// auth-service/src/controllers/get/get-doctors.ts
import { Request, Response } from 'express';
import { supabase } from "../../db/db_config";

// Define the types for the database response
interface User {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface DoctorProfile {
  id: string;
  specialization: string | null;
  consultation_fee: number | null;
  availability: any; // You can make this more specific based on your needs
  profile_image: string | null;
  verification_status: string;
  users: User;
}

// Updated formatted doctor type
interface FormattedDoctor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  specialization: string | null;
  consultationFee: number | null;
  availability: any | null;
  profileImage: string | null;
  verificationStatus: string;
}


const getDoctors = async (_req: any, res: any) => {
  try {
    // Check database connection
    const { error: healthCheckError } = await supabase.from("doctor_profiles").select("id").limit(1);
    if (healthCheckError) {
      console.error("Database connection error:", healthCheckError);
      return res.status(503).json({ error: "Database service unavailable" });
    }

    // Fetch approved doctors with type assertion
    const { data: doctors, error } = await supabase
      .from("doctor_profiles")
      .select(`
        id,
        specialization,
        consultation_fee,
        availability,
        profile_image,
        verification_status,
        users!doctor_profiles_user_id_fkey (
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq("verification_status", "approved")
      .returns<DoctorProfile[]>();

    if (error) {
      console.error("Supabase query error:", error);
      return res.status(500).json({ error: "Failed to fetch doctor profiles" });
    }

    if (!doctors || doctors.length === 0) {
      return res.status(200).json([]);
    }

    // Format and filter doctors with proper typing
    const formattedDoctors: FormattedDoctor[] = doctors
      .filter(doc => doc.users) // Ensure user data is present
      .map(doc => ({
        id: doc.id,
        name: `Dr. ${doc.users.first_name} ${doc.users.last_name}`,
        email: doc.users.email || null,
        phone: doc.users.phone || null,
        specialization: doc.specialization || null,
        consultationFee: doc.consultation_fee || null,
        availability: doc.availability || null,
        profileImage: doc.profile_image || null,
        verificationStatus: doc.verification_status,
      }));

    // Log filtered out doctors
    const filteredCount = doctors.length - formattedDoctors.length;
    if (filteredCount > 0) {
      console.warn(`Filtered out ${filteredCount} doctor(s) due to missing user data`);
    }

    return res.status(200).json(formattedDoctors);
  } catch (error) {
    console.error("Error in getDoctors controller:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred while fetching doctors",
    });
  }
};

export default getDoctors;