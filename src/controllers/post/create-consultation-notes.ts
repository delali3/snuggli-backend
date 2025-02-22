// auth-service/src/controllers/post/create-consultation-notes.ts
import { Request, Response } from 'express';
import { supabase } from "../../db/db_config";

interface CreateConsultationBody {
  appointmentId: string;
  symptoms: string[];
  diagnosis: string;
  prescription: string;
  additionalNotes?: string;
  meetingLink?: string;
  followUpDate?: string;
  followUpDuration?: string;
}

const createConsultationNotes = async (req: any, res: any) => {
  try {
    const doctorId = req.user?.id; // Assuming you have user data in request
    const consultationData: CreateConsultationBody = req.body;

    if (!doctorId) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    if (!consultationData.appointmentId) {
      return res.status(400).json({ error: "Appointment ID is required" });
    }

    // Validate required fields
    if (!consultationData.diagnosis || !consultationData.prescription) {
      return res.status(400).json({ error: "Diagnosis and prescription are required" });
    }

    // First verify the appointment exists and belongs to the doctor
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, patient_id")
      .eq("id", consultationData.appointmentId)
      .eq("doctor_id", doctorId)
      .single();

    if (appointmentError || !appointment) {
      console.error("Appointment fetch error:", appointmentError);
      return res.status(404).json({ error: "Appointment not found or unauthorized" });
    }

    // Create the consultation note
    const { data: newNote, error: createError } = await supabase
      .from("consultation_notes")
      .insert({
        appointment_id: consultationData.appointmentId,
        doctor_id: doctorId,
        patient_id: appointment.patient_id,
        symptoms: consultationData.symptoms,
        diagnosis: consultationData.diagnosis,
        prescription: consultationData.prescription,
        additional_notes: consultationData.additionalNotes,
        meeting_link: consultationData.meetingLink,
        follow_up_date: consultationData.followUpDate,
        follow_up_duration: consultationData.followUpDuration,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error("Create error:", createError);
      return res.status(500).json({ error: "Failed to create consultation notes" });
    }

    // Update appointment status to completed
    const { error: statusUpdateError } = await supabase
      .from("appointments")
      .update({ status: 'completed' })
      .eq("id", consultationData.appointmentId);

    if (statusUpdateError) {
      console.warn("Failed to update appointment status:", statusUpdateError);
      // Don't fail the whole request, just log the error
    }

    // If follow-up is specified, create follow-up appointment
    if (consultationData.followUpDate && consultationData.followUpDuration) {
      const { error: followUpError } = await supabase
        .from("appointments")
        .insert({
          patient_id: appointment.patient_id,
          doctor_id: doctorId,
          scheduled_time: consultationData.followUpDate,
          duration: parseInt(consultationData.followUpDuration),
          status: 'scheduled',
          type: 'follow_up',
          consultation_note_id: newNote.id
        });

      if (followUpError) {
        console.warn("Failed to create follow-up appointment:", followUpError);
        // Don't fail the whole request, just log the error
      }
    }

    return res.status(201).json({
      message: "Consultation notes created successfully",
      data: newNote
    });

  } catch (error) {
    console.error("Error in createConsultationNotes controller:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred while creating consultation notes",
    });
  }
};

export default createConsultationNotes;