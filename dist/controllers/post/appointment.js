"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/controllers/post/appointment.ts
const db_config_1 = require("../../db/db_config");
const zod_1 = require("zod");
// Validation schema for appointment data
const appointmentSchema = zod_1.z.object({
    description: zod_1.z.string()
        .min(5, "Description must be at least 5 characters long")
        .max(255, "Description cannot exceed 255 characters"),
    name: zod_1.z.string()
        .min(5, "Name must be at least 5 characters long")
        .max(255, "Name cannot exceed 255 characters"),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Appointment date must be in the format YYYY-MM-DD"),
    time: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, "Appointment time must be in the format HH:mm:ss"),
    status: zod_1.z.string()
        .min(3, "Status must be at least 3 characters long")
        .max(255, "Status cannot exceed 255 characters"),
    doctor_id: zod_1.z.string()
        .uuid("Doctor ID must be a valid UUID"),
    patient_id: zod_1.z.string()
        .uuid("Patient ID must be a valid UUID"),
});
/**
 * Create Appointment
 * @param req - Express Request object
 * @param res - Express Response object
 */
const createAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const { data: doctorData, error: doctorError } = yield db_config_1.supabase
            .from("users")
            .select("id")
            .eq("id", doctor_id)
            .single();
        if (doctorError || !doctorData) {
            return res.status(404).json({ error: "Doctor not found" });
        }
        // Check if patient_id exists
        const { data: patientData, error: patientError } = yield db_config_1.supabase
            .from("users")
            .select("id")
            .eq("id", patient_id)
            .single();
        if (patientError || !patientData) {
            return res.status(404).json({ error: "Patient not found" });
        }
        // Insert into the database
        const { data, error } = yield db_config_1.supabase.from("appointments").insert({
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
    }
    catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).json({ error: "An unexpected error occurred. Please try again later." });
    }
});
exports.default = createAppointment;
