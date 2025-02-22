// backend/src/model/consultation.ts
export interface ConsultationNote {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  symptoms: string[];
  diagnosis: string;
  prescription: string;
  additional_notes?: string;
  meeting_link?: string;
  follow_up_date?: string;
  follow_up_duration?: string;
  created_at: string;
  updated_at: string;
}

export interface FormattedConsultationNote {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  dateTime: string;
  status: string;
  priority: string;
  symptoms: string[];
  diagnosis: string;
  prescription: string;
  additionalNotes?: string;
  meetingLink?: string;
  followUpDate?: string;
  followUpDuration?: string;
  lastUpdated: string;
  patientImage?: string;
}