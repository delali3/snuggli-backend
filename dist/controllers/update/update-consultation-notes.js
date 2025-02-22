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
const updateConsultationNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { consultationId } = req.params;
        const doctorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Assuming you have user data in request
        const updateData = req.body;
        if (!doctorId) {
            return res.status(401).json({ error: "Unauthorized access" });
        }
        if (!consultationId) {
            return res.status(400).json({ error: "Consultation ID is required" });
        }
        // Validate required fields
        if (!updateData.diagnosis || !updateData.prescription) {
            return res.status(400).json({ error: "Diagnosis and prescription are required" });
        }
        // First check if the consultation exists and belongs to the doctor
        const { data: existingConsultation, error: fetchError } = yield db_config_1.supabase
            .from("consultation_notes")
            .select("id")
            .eq("id", consultationId)
            .eq("doctor_id", doctorId)
            .single();
        if (fetchError || !existingConsultation) {
            console.error("Consultation fetch error:", fetchError);
            return res.status(404).json({ error: "Consultation note not found or unauthorized" });
        }
        // Update the consultation note
        const { data: updatedNote, error: updateError } = yield db_config_1.supabase
            .from("consultation_notes")
            .update({
            symptoms: updateData.symptoms,
            diagnosis: updateData.diagnosis,
            prescription: updateData.prescription,
            additional_notes: updateData.additionalNotes,
            meeting_link: updateData.meetingLink,
            follow_up_date: updateData.followUpDate,
            follow_up_duration: updateData.followUpDuration,
            updated_at: new Date().toISOString()
        })
            .eq("id", consultationId)
            .eq("doctor_id", doctorId) // Extra security check
            .select()
            .single();
        if (updateError) {
            console.error("Update error:", updateError);
            return res.status(500).json({ error: "Failed to update consultation notes" });
        }
        // If follow-up is specified, create or update appointment
        if (updateData.followUpDate && updateData.followUpDuration) {
            const { error: appointmentError } = yield db_config_1.supabase
                .from("appointments")
                .upsert({
                patient_id: updatedNote.patient_id,
                doctor_id: doctorId,
                scheduled_time: updateData.followUpDate,
                duration: parseInt(updateData.followUpDuration),
                status: 'scheduled',
                type: 'follow_up',
                consultation_note_id: consultationId
            });
            if (appointmentError) {
                console.warn("Failed to create follow-up appointment:", appointmentError);
                // Don't fail the whole request, just log the error
            }
        }
        return res.status(200).json({
            message: "Consultation notes updated successfully",
            data: updatedNote
        });
    }
    catch (error) {
        console.error("Error in updateConsultationNotes controller:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: "An unexpected error occurred while updating consultation notes",
        });
    }
});
exports.default = updateConsultationNotes;
