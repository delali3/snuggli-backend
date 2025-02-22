// auth-service/src/controllers/get/schedule.ts
import { Request, Response } from 'express';
import { supabase } from "../../db/db_config";
import dayjs from 'dayjs';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email: string;
  };
}

// Schedule new appointment
export const scheduleAppointment = async (req: AuthRequest, res: any) => {
    try {
      const userId = req.user?.userId;
      const { doctorId, dateTime, notes } = req.body;
  
      if (!userId || !doctorId || !dateTime) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      // Check if slot is still available
      const appointmentTime = dayjs(dateTime);
      const { data: existingAppointment, error: checkError } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('status', 'upcoming')
        .eq('date_time', appointmentTime.toISOString())
        .single();
  
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
  
      if (existingAppointment) {
        return res.status(409).json({ error: 'Time slot no longer available' });
      }
  
      // Create appointment
      const { data: appointment, error: createError } = await supabase
        .from('appointments')
        .insert({
          patient_id: userId,
          doctor_id: doctorId,
          date_time: appointmentTime.toISOString(),
          status: 'upcoming',
          notes
        })
        .select(`
          *,
          doctor_profiles!inner(
            id,
            specialization,
            users!inner(
              first_name,
              last_name
            )
          )
        `)
        .single();
  
      if (createError) throw createError;
  
      const formattedAppointment = {
        id: appointment.id,
        doctorId: appointment.doctor_profiles.id,
        doctorName: `Dr. ${appointment.doctor_profiles.users.first_name} ${appointment.doctor_profiles.users.last_name}`,
        specialization: appointment.doctor_profiles.specialization,
        dateTime: appointment.date_time,
        status: appointment.status,
        notes: appointment.notes
      };
  
      return res.status(201).json(formattedAppointment);
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      return res.status(500).json({ error: 'Failed to schedule appointment' });
    }
  };
  

export default scheduleAppointment;