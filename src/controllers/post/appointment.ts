// backend/src/controllers/post/appointment.ts
import { supabase } from "../../db/db_config";
import { z } from "zod";

// Validation schema for appointment data
const appointmentSchema = z.object({
  description: z.string()
    .min(5, "Description must be at least 5 characters long")
    .max(255, "Description cannot exceed 255 characters"),
  name: z.string()
    .min(5, "Name must be at least 5 characters long")
    .max(255, "Name cannot exceed 255 characters"),
  date: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Appointment date must be in the format YYYY-MM-DD"
  ),
  time: z.string().regex(
    /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
    "Appointment time must be in the format HH:mm:ss"
  ),
  status: z.string()
    .min(3, "Status must be at least 3 characters long")
    .max(255, "Status cannot exceed 255 characters"),
  doctor_id: z.string()
    .uuid("Doctor ID must be a valid UUID"),
  patient_id: z.string()
    .uuid("Patient ID must be a valid UUID"),
});

/**
 * Create Appointment
 * @param req - Express Request object
 * @param res - Express Response object
 */
const createAppointment = async (req: any, res: any) => {
  try {
    // Validate incoming data
    const validation = appointmentSchema.safeParse(req.body);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message);
      return res.status(400).json({ errors });
    }

    // Destructure validated data
    const { name, description, date, time, status, doctor_id, patient_id } = validation.data;

    // Check if doctor_id exists
    const { data: doctorData, error: doctorError } = await supabase
      .from("users")
      .select("id")
      .eq("id", doctor_id)
      .single();

    if (doctorError || !doctorData) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Check if patient_id exists
    const { data: patientData, error: patientError } = await supabase
      .from("users")
      .select("id")
      .eq("id", patient_id)
      .single();

    if (patientError || !patientData) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Insert into the database
    const { data, error } = await supabase.from("appointments").insert({
      name,
      description,
      date,
      time,
      status,
      doctor_id,
      patient_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Database error:", error.message);
      return res.status(500).json({ error: "Database insertion failed. Please try again later." });
    }

    return res.status(201).json({ message: "Appointment created successfully", data });
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "An unexpected error occurred. Please try again later." });
  }
};

export default createAppointment;
