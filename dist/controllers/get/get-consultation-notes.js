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
const db_config_1 = require("../../db/db_config");
const getConsultationNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Check database connection
        const { error: healthCheckError } = yield db_config_1.supabase
            .from("consultation_notes")
            .select("id")
            .limit(1);
        if (healthCheckError) {
            console.error("Database connection error:", healthCheckError);
            return res.status(503).json({ error: "Database service unavailable" });
        }
        const doctorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Assuming you have user data in request
        if (!doctorId) {
            return res.status(401).json({ error: "Unauthorized access" });
        }
        // Fetch consultation notes with related data
        const { data: consultations, error } = yield db_config_1.supabase
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
            .returns();
        if (error) {
            console.error("Supabase query error:", error);
            return res.status(500).json({ error: "Failed to fetch consultation notes" });
        }
        if (!consultations || consultations.length === 0) {
            return res.status(200).json([]);
        }
        // Format the consultation notes
        const formattedNotes = consultations
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
    }
    catch (error) {
        console.error("Error in getConsultationNotes controller:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: "An unexpected error occurred while fetching consultation notes",
        });
    }
});
exports.default = getConsultationNotes;
