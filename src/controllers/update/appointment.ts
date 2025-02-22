import { supabase } from "../../db/db_config";
import { z } from "zod";

interface User {
  id: string;
  role: string;
  first_name: string;
  last_name: string;
}

interface DoctorProfile {
  id: string;
  specialization: string;
  consultation_fee: number;
  users: User;
}


const updateAppointmentSchema = z.object({
  description: z.string()
    .min(1, "Description cannot be empty"),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Appointment date must be in the format YYYY-MM-DD")
    .optional(),
  time: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, "Appointment time must be in the format HH:mm:ss")
    .optional(),
  doctor_id: z.string()
    .optional(),
});

const updateAppointment = async (req: any, res: any) => {
  try {
    const { appointmentId } = req.params;
    console.log('Received update request:', {
      appointmentId,
      body: req.body
    });

    // Get the current appointment first
    const { data: existingAppointment, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        *,
        doctor_profiles!inner(
          id,
          specialization,
          users!inner(
            id,
            first_name,
            last_name
          )
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (fetchError || !existingAppointment) {
      console.log('Appointment not found:', appointmentId);
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Validate incoming data
    const validation = updateAppointmentSchema.safeParse(req.body);
    if (!validation.success) {
      console.log('Validation failed:', validation.error.issues);
      const errors = validation.error.issues.map((issue) => issue.message);
      return res.status(400).json({ errors });
    }

    const updateData = validation.data;

    // If doctor_id is being updated, verify the doctor exists
    if (updateData.doctor_id) {
      console.log('Checking doctor:', updateData.doctor_id);
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctor_profiles")
        .select(`
          id,
          users!inner(
            id,
            role
          )
        `)
        .eq("id", updateData.doctor_id)
        .single();

      // if (doctorError || !doctorData || doctorData.users.role !== 'doctor') {
      //   console.log('Doctor not found:', doctorError || 'No data');
      //   return res.status(404).json({ error: "Doctor not found" });
      // }
    }

    // Prepare update data
    const appointmentUpdate = {
      doctor_id: updateData.doctor_id,
      notes: updateData.description,
      date_time: updateData.date && updateData.time ? 
        `${updateData.date}T${updateData.time}` : 
        undefined,
      updated_at: new Date().toISOString()
    };

    // Update the appointment
    const { data: updatedAppointment, error: updateError } = await supabase
      .from("appointments")
      .update(appointmentUpdate)
      .eq("id", appointmentId)
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
      .single();

    if (updateError) {
      console.error("Database error:", updateError.message);
      return res.status(500).json({ 
        error: "Failed to update appointment. Please try again later." 
      });
    }

    // Format the response to match the get appointments format
    const formattedAppointment = {
      id: updatedAppointment.id,
      doctorId: updatedAppointment.doctor_profiles.id,
      doctorName: `Dr. ${updatedAppointment.doctor_profiles.users.first_name} ${updatedAppointment.doctor_profiles.users.last_name}`,
      specialization: updatedAppointment.doctor_profiles.specialization,
      dateTime: updatedAppointment.date_time,
      status: updatedAppointment.status,
      notes: updatedAppointment.notes,
      consultationFee: updatedAppointment.doctor_profiles.consultation_fee
    };

    console.log('Successfully updated appointment:', formattedAppointment);

    return res.status(200).json({
      message: "Appointment updated successfully",
      data: formattedAppointment
    });

  } catch (error: any) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ 
      error: "An unexpected error occurred. Please try again later." 
    });
  }
};

export default updateAppointment;