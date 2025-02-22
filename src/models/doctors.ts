// types/database.types.ts

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    profile_image?: string;
    role: 'doctor' | 'patient' | 'admin';
    created_at: string;
    updated_at: string;
  }
  
  export interface DoctorProfile {
    id: string;
    user_id: string;
    specialization: string;
    consultation_fee: number;
    availability: any[];
    verification_status: string;
    experience: number;
    profile_image?: string;
    created_at: string;
    updated_at: string;
    users?: User;
  }
  
  
  export interface Appointment {
    id: string;
    patient_id: string;
    doctor_id: string;
    date_time: string;
    status: 'upcoming' | 'completed' | 'cancelled';
    type: 'consultation' | 'follow-up' | 'emergency';
    priority: 'normal' | 'urgent';
    symptoms: string[];
    notes?: string;
    created_at: string;
    updated_at: string;
    users?: User;
    doctor_profiles?: DoctorProfile;
  }
  
  export interface ConsultationNote {
    id: string;
    appointment_id: string;
    symptoms: string[];
    diagnosis: string;
    prescription: string;
    additional_notes?: string;
    follow_up_date?: string;
    created_at: string;
    updated_at: string;
    appointments?: Appointment;
  }
  