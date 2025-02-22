// auth-service/src/controllers/post/add-appointment-notes.ts
import { Request, Response } from 'express';
import { supabase } from "../../db/db_config";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email: string;
  };
}
const addAppointmentNotes = async (req: AuthRequest, res: any) => {
  try {
    const doctorId = req.user?.userId;
    const { appointmentId } = req.params;
    const { notes } = req.body;

    if (!doctorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('doctor_id')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.doctor_id !== doctorId) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update({ 
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({ message: 'Appointment notes updated successfully' });

  } catch (error) {
    console.error('Error in addAppointmentNotes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default addAppointmentNotes;