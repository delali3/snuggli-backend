// auth-service/src/controllers/get/get-doctor-appointments-by-date.ts
import { Request, Response } from 'express';
import { supabase } from "../../db/db_config";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email: string;
  };
}

const getDoctorAppointmentsByDate = async (req: AuthRequest, res: any) => {
  try {
    const doctorId = req.user?.userId;
    const { date } = req.params;
    
    if (!doctorId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const startOfDay = `${date}T00:00:00Z`;
    const endOfDay = `${date}T23:59:59Z`;

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        users!inner(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('doctor_id', doctorId)
      .gte('date_time', startOfDay)
      .lte('date_time', endOfDay)
      .order('date_time', { ascending: true });

    if (error) throw error;

    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      date_time: apt.date_time,
      status: apt.status || 'upcoming',
      consultation_type: apt.consultation_type || 'checkup',
      consultation_fee: apt.consultation_fee || 0,
      notes: apt.notes,
      symptoms: apt.symptoms,
      patient: {
        id: apt.users.id,
        first_name: apt.users.first_name,
        last_name: apt.users.last_name,
        email: apt.users.email,
        phone: apt.users.phone
      }
    }));

    return res.status(200).json(formattedAppointments);

  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

export default getDoctorAppointmentsByDate;