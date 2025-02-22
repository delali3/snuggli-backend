// controllers/patient/consultationNotes.controller.ts
import { Request, Response } from "express";
import { supabase } from "../../db/db_config";

// types/consultation.ts
interface User {
  id: string;
  first_name: string;
  last_name: string;
  profile_image: string | null;
}

interface DoctorProfileUser {
  id: string;
  first_name: string;
  last_name: string;
  profile_image: string | null;
}

interface DoctorProfile {
  id: string;
  specialization: string;
  users: DoctorProfileUser;
}

interface AppointmentDoctor {
  id: string;
  specialization: string;
  users: DoctorProfileUser;
}

interface Appointment {
  id: string;
  date_time: string;
  status: string;
  priority: string;
  type: string;
  patient_id: string;
  doctor_profiles: AppointmentDoctor;
}

interface ConsultationSymptom {
  id: string;
  symptoms: string;
}

interface DatabaseConsultationNote {
  id: string;
  diagnosis: string | null;
  prescription: string | null;
  additional_notes: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
  meeting_link: string | null;
  consultation_symptoms: ConsultationSymptom[];
  appointments: Appointment;
}

interface FormattedConsultation {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorImage: string | null;
  dateTime: string;
  status: string;
  priority: string;
  symptoms: string[];
  diagnosis: string | null;
  prescription: string | null;
  additionalNotes: string | null;
  meeting_link: string | null;
  followUpDate: string | null;
  lastUpdated: string;
}

export type {
  DatabaseConsultationNote,
  FormattedConsultation,
  ConsultationSymptom
};

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

const patientConsultationController = {
  getAllConsultationNotes: async (req: AuthRequest, res: any) => {
    try {
      const userId = req.user?.userId;
      console.log("Fetching consultations for user:", userId);

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { data: consultations, error: consultationsError } = await supabase
        .from("consultation_notes")
        .select(`
          id,
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
            patient_id,
            doctor_profiles!inner (
              id,
              specialization,
              users (
                id,
                first_name,
                last_name,
                profile_image
              )
            )
          )
        `)
        .eq("appointments.patient_id", userId)
        .order("created_at", { ascending: false })
        .returns<DatabaseConsultationNote[]>();

      if (consultationsError) {
        console.error("Error fetching consultations:", consultationsError);
        throw consultationsError;
      }

      console.log("Raw consultations data:", JSON.stringify(consultations, null, 2));

      // Format the consultations data
      const formattedConsultations: FormattedConsultation[] = consultations.map((note) => {
        // Parse symptoms from consultation_symptoms
        const symptomsData = note.consultation_symptoms?.[0]?.symptoms;
        let parsedSymptoms: string[] = [];

        if (symptomsData) {
          try {
            if (typeof symptomsData === 'string') {
              if (symptomsData.startsWith('{') && symptomsData.endsWith('}')) {
                parsedSymptoms = symptomsData
                  .slice(1, -1)
                  .split(',')
                  .map(s => s.replace(/^"(.*)"$/, '$1').trim())
                  .filter(Boolean);
              } else {
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

        return {
          id: note.id,
          doctorId: note.appointments.doctor_profiles.id,
          doctorName: `${note.appointments.doctor_profiles.users.first_name} ${note.appointments.doctor_profiles.users.last_name}`,
          doctorSpecialization: note.appointments.doctor_profiles.specialization,
          doctorImage: note.appointments.doctor_profiles.users.profile_image,
          dateTime: note.appointments.date_time,
          status: note.appointments.status,
          priority: note.appointments.priority,
          symptoms: parsedSymptoms,
          diagnosis: note.diagnosis,
          prescription: note.prescription,
          additionalNotes: note.additional_notes,
          meeting_link: note.meeting_link,
          followUpDate: note.follow_up_date,
          lastUpdated: note.updated_at
        };
      });

      return res.status(200).json({ data: formattedConsultations });
    } catch (error) {
      console.error("Error in getAllConsultationNotes:", error);
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
        .from("consultation_notes")
        .select(`
          id,
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
            patient_id,
            doctor_profiles!inner (
              id,
              specialization,
              users (
                id,
                first_name,
                last_name,
                profile_image
              )
            )
          )
        `)
        .eq("id", consultationId)
        .single<DatabaseConsultationNote>();

      if (consultationError) {
        console.error("Error fetching consultation:", consultationError);
        return res.status(404).json({ error: "Consultation not found" });
      }

      // Verify the consultation belongs to the patient
      if (consultation.appointments.patient_id !== userId) {
        return res.status(403).json({ error: "Not authorized to view this consultation" });
      }

      // Parse symptoms
      const symptomsData = consultation.consultation_symptoms?.[0]?.symptoms;
      let parsedSymptoms: string[] = [];

      if (symptomsData) {
        try {
          if (typeof symptomsData === 'string') {
            if (symptomsData.startsWith('{') && symptomsData.endsWith('}')) {
              parsedSymptoms = symptomsData
                .slice(1, -1)
                .split(',')
                .map(s => s.replace(/^"(.*)"$/, '$1').trim())
                .filter(Boolean);
            } else {
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

      const formattedConsultation: FormattedConsultation = {
        id: consultation.id,
        doctorId: consultation.appointments.doctor_profiles.id,
        doctorName: `${consultation.appointments.doctor_profiles.users.first_name} ${consultation.appointments.doctor_profiles.users.last_name}`,
        doctorSpecialization: consultation.appointments.doctor_profiles.specialization,
        doctorImage: consultation.appointments.doctor_profiles.users.profile_image,
        dateTime: consultation.appointments.date_time,
        status: consultation.appointments.status,
        priority: consultation.appointments.priority,
        symptoms: parsedSymptoms,
        diagnosis: consultation.diagnosis,
        prescription: consultation.prescription,
        additionalNotes: consultation.additional_notes,
        meeting_link: consultation.meeting_link,
        followUpDate: consultation.follow_up_date,
        lastUpdated: consultation.updated_at
      };

      return res.status(200).json({ data: formattedConsultation });
    } catch (error) {
      console.error("Error in getConsultationNoteById:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};

export default patientConsultationController;