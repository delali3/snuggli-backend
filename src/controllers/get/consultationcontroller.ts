import { Request, Response } from "express";
import { supabase } from "../../db/db_config";
import dayjs from "dayjs";
import { DoctorProfile, ConsultationNote } from "../../models/doctors";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

interface ErrorWithMessage {
  message: string;
  stack?: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_image: string | null;
}

interface ConsultationSymptom {
  id: string;
  consultation_id: string;
  symptoms: string;
  created_at: string;
  updated_at: string;
}


interface DoctorProfileInfo {
  user_id: string;
}

interface AppointmentWithUser extends Appointment {
  user: User;
  doctor_profiles?: DoctorProfileInfo; // Add this line
}

// Also update your ConsultationNoteWithRelations to ensure it matches the Supabase query
interface ConsultationNoteWithRelations
  extends Omit<ConsultationNote, "appointments"> {
  appointments?: AppointmentWithUser;
  consultation_symptoms?: ConsultationSymptom[];
  appointment_id: string;
  symptoms: string[];
  diagnosis: string;
  prescription: string;
  additional_notes?: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
  meeting_link: string;
}

interface Appointment {
  id: string;
  date_time: string;
  status: string;
  priority: string;
  type: string;
  user_id: string;
  doctor_id: string;
}

const consultationNotesController = {
  getAllConsultationNotes: async (req: AuthRequest, res: any) => {
    try {
      const userId = req.user?.userId;
      console.log("User ID:", userId); // Debug log

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get doctor profile
      const { data: doctorProfile, error: profileError } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", userId)
        .single<DoctorProfile>();

      console.log("Doctor Profile Query:", {
        data: doctorProfile,
        error: profileError,
      }); // Debug log

      if (profileError) {
        console.error("Profile Error:", profileError); // Detailed error log
        return res
          .status(404)
          .json({ error: "Doctor profile not found", details: profileError });
      }

      if (!doctorProfile) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }

      // Get all consultation notes with related data
      const { data: consultations, error: consultationsError } = await supabase
      .from("consultation_notes")
      .select(`
        id,
        appointment_id,
        diagnosis,
        prescription,
        additional_notes,
        follow_up_date,
        created_at,
        updated_at,
        meeting_link,
        consultation_symptoms (
          id,
          symptoms
        ),
        appointments!inner (
          id,
          date_time,
          status,
          priority,
          type,
          user:users!inner ( 
            id,
            first_name,
            last_name,
            email,
            phone,
            profile_image
          )
        )
      `)
      .eq("appointments.doctor_id", doctorProfile.id)
      .order("created_at", { ascending: false })
      .returns<ConsultationNoteWithRelations[]>();


      console.log("Consultations Query:", {
        doctorId: doctorProfile.id,
        data: consultations,
        error: consultationsError,
      }); // Debug log

      if (consultationsError) {
        console.error("Consultations Error:", consultationsError); // Detailed error log
        throw consultationsError;
      }

      // In your controller (backend)
      const formattedConsultations = consultations.map((note) => {
        // Get symptoms from consultation_symptoms
        const symptomsData = note.consultation_symptoms?.[0]?.symptoms;
        let parsedSymptoms: string[] = [];

        if (symptomsData) {
          try {
            // Handle PostgreSQL array format (e.g., {"symptom1","symptom2"})
            if (typeof symptomsData === 'string') {
              if (symptomsData.startsWith('{') && symptomsData.endsWith('}')) {
                // Remove the curly braces and split by comma
                parsedSymptoms = symptomsData
                  .slice(1, -1)  // Remove { and }
                  .split(',')
                  .map(s => s.replace(/^"(.*)"$/, '$1').trim()) // Remove quotes and trim
                  .filter(Boolean); // Remove empty strings
              } else {
                // If it's just a regular string, make it an array
                parsedSymptoms = [symptomsData];
              }
            } else if (Array.isArray(symptomsData)) {
              parsedSymptoms = symptomsData;
            }
          } catch (e) {
            console.error('Error parsing symptoms:', e, symptomsData);
            parsedSymptoms = [];
          }
        }

        // Format consultation notes data
        return {
          id: note.id,
          patientId: note.appointments?.user?.id || "",
          patientName: `${note.appointments?.user?.first_name || ""} ${note.appointments?.user?.last_name || ""}`,
          dateTime: note.appointments?.date_time || "",
          status: note.appointments?.status || "",
          priority: note.appointments?.priority || "",
          symptoms: parsedSymptoms, // Now it's an array
          diagnosis: note.diagnosis || "",
          prescription: note.prescription || "",
          additionalNotes: note.additional_notes || "",
          followUpDate: note.follow_up_date || null,
          lastUpdated: note.updated_at,
          patientImage: note.appointments?.user?.profile_image || null,
          meeting_link: note.meeting_link || "",
        };
      });
      return res.status(200).json({ data: formattedConsultations });
    } catch (error) {
      // Enhanced error logging
      console.error("Detailed error in getAllConsultationNotes:", {
        error,
        // message: error.message,
        // stack: error.stack
      });
      return res.status(500).json({
        error: "Internal server error",
        // details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  updateConsultationNotes: async (req: AuthRequest, res: any) => {
    try {
      const userId = req.user?.userId;
      const { consultationId } = req.params;
      const {
        symptoms,
        diagnosis,
        prescription,
        additionalNotes,
        followUpDate,
        meeting_link,
      } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify doctor owns the consultation note
      const { data: consultation, error: consultationError } = await supabase
        .from("consultation_notes")
        .select("appointments!inner(doctor_id, doctor_profiles!inner(user_id))")
        .eq("id", consultationId)
        .single();

      if (consultationError || !consultation) {
        return res.status(404).json({ error: "Consultation not found" });
      }

      // Start with consultation_notes update
      const { error: updateError } = await supabase
        .from("consultation_notes")
        .update({
          diagnosis,
          prescription,
          additional_notes: additionalNotes,
          follow_up_date: followUpDate,
          meeting_link: meeting_link,
          updated_at: new Date().toISOString(),
        })
        .eq("id", consultationId);

      if (updateError) {
        throw updateError;
      }

      // Format symptoms for PostgreSQL array
      let formattedSymptoms: string;
      if (Array.isArray(symptoms)) {
        formattedSymptoms = `{${symptoms.map((s: string) => `"${s}"`).join(',')}}`;
      } else if (typeof symptoms === 'string') {
        try {
          const parsedSymptoms: string[] = JSON.parse(symptoms);
          formattedSymptoms = `{${parsedSymptoms.map((s: string) => `"${s}"`).join(',')}}`;
        } catch (e) {
          formattedSymptoms = `{"${symptoms}"}`;
        }
      } else {
        formattedSymptoms = '{}';
      }

      // Check if symptoms record exists
      const { data: existingSymptoms, error: symptomsCheckError } = await supabase
        .from("consultation_symptoms")
        .select()
        .eq("consultation_id", consultationId)
        .single();

      if (symptomsCheckError && symptomsCheckError.code !== 'PGRST116') {
        throw symptomsCheckError;
      }

      // Update or insert symptoms based on existence
      const symptomsData = {
        consultation_id: consultationId,
        symptoms: formattedSymptoms,
        updated_at: new Date().toISOString(),
      };

      let symptomsUpdate;
      if (existingSymptoms) {
        symptomsUpdate = await supabase
          .from("consultation_symptoms")
          .update(symptomsData)
          .eq("consultation_id", consultationId);
      } else {
        symptomsUpdate = await supabase
          .from("consultation_symptoms")
          .insert({
            ...symptomsData,
            created_at: new Date().toISOString(),
          });
      }

      if (symptomsUpdate.error) {
        throw symptomsUpdate.error;
      }

      // Fetch the updated consultation with all related data
      const { data: updatedConsultation, error: fetchError } = await supabase
        .from("consultation_notes")
        .select(`
          id,
          diagnosis,
          prescription,
          additional_notes,
          follow_up_date,
          updated_at,
          consultation_symptoms (
            symptoms
          )
        `)
        .eq("id", consultationId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return res.status(200).json({
        message: "Consultation notes updated successfully",
        data: updatedConsultation,
      });

    } catch (error) {
      console.error("Error in updateConsultationNotes:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  getConsultationNoteById: async (req: AuthRequest, res: any) => {
    try {
      const userId = req.user?.userId;
      const { consultationId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { data: consultation, error: consultationError } = await supabase
      .from('consultation_notes')
      .select(`
        id,
        appointment_id,
        diagnosis,
        prescription,
        additional_notes,
        follow_up_date,
        created_at,
        updated_at,
        consultation_symptoms (
          id,
          symptoms
        ),
        appointments!inner (
          id,
          date_time,
          status,
          priority,
          type,
          user:user_id!inner (
            id,
            first_name,
            last_name,
            profile_image
          ),
          doctor_profiles!inner (
            user_id
          )
        )
      `)
      .eq('id', consultationId)
      .single<ConsultationNoteWithRelations>();


      if (consultationError || !consultation) {
        return res.status(404).json({ error: "Consultation not found" });
      }

      // Verify doctor owns the consultation
      if (consultation.appointments?.doctor_profiles?.user_id !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this consultation" });
      }

      const formattedConsultation = {
        id: consultation.id,
        patientId: consultation.appointments?.user?.id || '',
        patientName: `${consultation.appointments?.user?.first_name} ${consultation.appointments?.user?.last_name}`,
        dateTime: consultation.appointments?.date_time || '',
        status: consultation.appointments?.status || '',
        priority: consultation.appointments?.priority || '',
        symptoms: consultation.consultation_symptoms?.[0]?.symptoms || "[]",
        diagnosis: consultation.diagnosis,
        prescription: consultation.prescription,
        additionalNotes: consultation.additional_notes,
        followUpDate: consultation.follow_up_date,
        lastUpdated: consultation.updated_at,
        patientImage: consultation.appointments?.user?.profile_image
      };
      
      return res.status(200).json({ data: formattedConsultation });
    } catch (error) {
      console.error("Error in getConsultationNoteById:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};


export default consultationNotesController;
