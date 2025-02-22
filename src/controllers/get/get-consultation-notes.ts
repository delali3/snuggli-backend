// auth-service/src/controllers/get/get-consultation-notes.ts
import { Request, Response } from 'express';
import { supabase } from "../../db/db_config";
import { ConsultationNote, FormattedConsultationNote } from '../../models/consultation';

interface AppointmentDetails {
  id: string;
  patient_id: string;
  status: string;
  priority: string;
  scheduled_time: string;
  patients: {
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
}

const getConsultationNotes = async (req: any, res: any) => {
  try {
    // Check database connection
    const { error: healthCheckError } = await supabase
      .from("consultation_notes")
      .select("id")
      .limit(1);

    if (healthCheckError) {
      console.error("Database connection error:", healthCheckError);
      return res.status(503).json({ error: "Database service unavailable" });
    }

    const doctorId = req.user?.id; // Assuming you have user data in request
    if (!doctorId) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    // Fetch consultation notes with related data
    const { data: consultations, error } = await supabase
      .from("consultation_notes")
      .select(`
        *,
        appointments!consultation_notes_appointment_id_fkey (
          id,
          patient_id,
          status,
          priority,
          scheduled_time,
          patients!appointments_patient_id_fkey (
            first_name,
            last_name,
            profile_image
          )
        )
      `)
      .eq('doctor_id', doctorId)
      .returns<(ConsultationNote & { appointments: AppointmentDetails })[]>();

    if (error) {
      console.error("Supabase query error:", error);
      return res.status(500).json({ error: "Failed to fetch consultation notes" });
    }

    if (!consultations || consultations.length === 0) {
      return res.status(200).json([]);
    }

    // Format the consultation notes
    const formattedNotes: FormattedConsultationNote[] = consultations
      .filter(note => note.appointments && note.appointments.patients) // Ensure all required data is present
      .map(note => ({
        id: note.id,
        appointmentId: note.appointment_id,
        patientId: note.appointments.patient_id,
        patientName: `${note.appointments.patients.first_name} ${note.appointments.patients.last_name}`,
        dateTime: note.appointments.scheduled_time,
        status: note.appointments.status,
        priority: note.appointments.priority,
        symptoms: note.symptoms,
        diagnosis: note.diagnosis,
        prescription: note.prescription,
        additionalNotes: note.additional_notes,
        meetingLink: note.meeting_link,
        followUpDate: note.follow_up_date,
        followUpDuration: note.follow_up_duration,
        lastUpdated: note.updated_at,
        patientImage: note.appointments.patients.profile_image
      }));

    // Log filtered out notes
    const filteredCount = consultations.length - formattedNotes.length;
    if (filteredCount > 0) {
      console.warn(`Filtered out ${filteredCount} consultation note(s) due to missing related data`);
    }

    return res.status(200).json(formattedNotes);

  } catch (error) {
    console.error("Error in getConsultationNotes controller:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred while fetching consultation notes",
    });
  }
};

export default getConsultationNotes;