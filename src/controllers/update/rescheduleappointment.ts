// auth-service/src/controllers/update/rescheduleappointment.ts
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

// Reschedule appointment
export const rescheduleAppointment = async (req: AuthRequest, res: any) => {
    try {
      const userId = req.user?.userId;
      const { appointmentId } = req.params;
      const { dateTime } = req.body;
  
      if (!userId || !appointmentId || !dateTime) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      // Verify appointment belongs to user and is upcoming
      const { data: appointment, error: checkError } = await supabase
        .from('appointments')
        .select('id, doctor_id, status')
        .eq('id', appointmentId)
        .eq('patient_id', userId)
        .single();
  
      if (checkError) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
  
      if (appointment.status !== 'upcoming') {
        return res.status(400).json({ error: 'Can only reschedule upcoming appointments' });
      }
  
      // Check if new slot is available
      const newTime = dayjs(dateTime);
      const { data: existingAppointment, error: slotCheckError } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', appointment.doctor_id)
        .eq('status', 'upcoming')
        .eq('date_time', newTime.toISOString())
        .single();
  
      if (slotCheckError && slotCheckError.code !== 'PGRST116') {
        throw slotCheckError;
      }
  
      if (existingAppointment) {
        return res.status(409).json({ error: 'New time slot is not available' });
      }
  
      // Update appointment
      const { data: updatedAppointment, error: updateError } = await supabase
        .from('appointments')
        .update({ date_time: newTime.toISOString() })
        .eq('id', appointmentId)
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
  
      if (updateError) throw updateError;
  
      const formattedAppointment = {
        id: updatedAppointment.id,
        doctorId: updatedAppointment.doctor_profiles.id,
        doctorName: `Dr. ${updatedAppointment.doctor_profiles.users.first_name} ${updatedAppointment.doctor_profiles.users.last_name}`,
        specialization: updatedAppointment.doctor_profiles.specialization,
        dateTime: updatedAppointment.date_time,
        status: updatedAppointment.status,
        notes: updatedAppointment.notes
      };
  
      return res.status(200).json(formattedAppointment);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return res.status(500).json({ error: 'Failed to reschedule appointment' });
    }
  };