// auth-service/src/controllers/appointment/index.ts
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

// Cancel appointment
export const cancelAppointment = async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;
    const { appointmentId } = req.params;

    if (!userId || !appointmentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify appointment belongs to user
    const { data: appointment, error: checkError } = await supabase
      .from('appointments')
      .select('id, status')
      .eq('id', appointmentId)
      .eq('patient_id', userId)
      .single();

    if (checkError) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status !== 'upcoming') {
      return res.status(400).json({ error: 'Can only cancel upcoming appointments' });
    }

    // Cancel appointment
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId);

    if (updateError) throw updateError;

    return res.status(200).json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};
