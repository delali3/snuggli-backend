import { supabase } from "../../db/db_config";
import { z } from "zod";


interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email: string;
  };
}

// Get user's appointments
export const getAppointments = async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor_profiles!inner(
          id,
          specialization,
          consultation_fee,
          users!inner(
            first_name,
            last_name
          )
        )
      `)
      .eq('patient_id', userId)
      .order('date_time', { ascending: false });

    if (error) throw error;

    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      doctorId: apt.doctor_profiles.id,
      doctorName: `Dr. ${apt.doctor_profiles.users.first_name} ${apt.doctor_profiles.users.last_name}`,
      specialization: apt.doctor_profiles.specialization,
      dateTime: apt.date_time,
      status: apt.status,
      notes: apt.notes,
      consultationFee: apt.doctor_profiles.consultation_fee
    }));

    return res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};


export default getAppointments;