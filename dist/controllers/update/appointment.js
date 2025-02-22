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
const zod_1 = require("zod");
const updateAppointmentSchema = zod_1.z.object({
    description: zod_1.z.string()
        .min(1, "Description cannot be empty"),
    date: zod_1.z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Appointment date must be in the format YYYY-MM-DD")
        .optional(),
    time: zod_1.z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, "Appointment time must be in the format HH:mm:ss")
        .optional(),
    doctor_id: zod_1.z.string()
        .optional(),
});
const updateAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId } = req.params;
        console.log('Received update request:', {
            appointmentId,
            body: req.body
        });
        // Get the current appointment first
        const { data: existingAppointment, error: fetchError } = yield db_config_1.supabase
            .from("appointments")
            .select(`
        *,
        doctor_profiles!inner(
          id,
          specialization,
          users!inner(
            id,
            first_name,
            last_name
          )
        )
      `)
            .eq("id", appointmentId)
            .single();
        if (fetchError || !existingAppointment) {
            console.log('Appointment not found:', appointmentId);
            return res.status(404).json({ error: "Appointment not found" });
        }
        // Validate incoming data
        const validation = updateAppointmentSchema.safeParse(req.body);
        if (!validation.success) {
            console.log('Validation failed:', validation.error.issues);
            const errors = validation.error.issues.map((issue) => issue.message);
            return res.status(400).json({ errors });
        }
        const updateData = validation.data;
        // If doctor_id is being updated, verify the doctor exists
        if (updateData.doctor_id) {
            console.log('Checking doctor:', updateData.doctor_id);
            const { data: doctorData, error: doctorError } = yield db_config_1.supabase
                .from("doctor_profiles")
                .select(`
          id,
          users!inner(
            id,
            role
          )
        `)
                .eq("id", updateData.doctor_id)
                .single();
            // if (doctorError || !doctorData || doctorData.users.role !== 'doctor') {
            //   console.log('Doctor not found:', doctorError || 'No data');
            //   return res.status(404).json({ error: "Doctor not found" });
            // }
        }
        // Prepare update data
        const appointmentUpdate = {
            doctor_id: updateData.doctor_id,
            notes: updateData.description,
            date_time: updateData.date && updateData.time ?
                `${updateData.date}T${updateData.time}` :
                undefined,
            updated_at: new Date().toISOString()
        };
        // Update the appointment
        const { data: updatedAppointment, error: updateError } = yield db_config_1.supabase
            .from("appointments")
            .update(appointmentUpdate)
            .eq("id", appointmentId)
            .select(`
        *,
        doctor_profiles!inner(
          id,
          specialization,
          consultation_fee,
          users!inner(
            first_name,
            last_name
          )
        )
      `)
            .single();
        if (updateError) {
            console.error("Database error:", updateError.message);
            return res.status(500).json({
                error: "Failed to update appointment. Please try again later."
            });
        }
        // Format the response to match the get appointments format
        const formattedAppointment = {
            id: updatedAppointment.id,
            doctorId: updatedAppointment.doctor_profiles.id,
            doctorName: `Dr. ${updatedAppointment.doctor_profiles.users.first_name} ${updatedAppointment.doctor_profiles.users.last_name}`,
            specialization: updatedAppointment.doctor_profiles.specialization,
            dateTime: updatedAppointment.date_time,
            status: updatedAppointment.status,
            notes: updatedAppointment.notes,
            consultationFee: updatedAppointment.doctor_profiles.consultation_fee
        };
        console.log('Successfully updated appointment:', formattedAppointment);
        return res.status(200).json({
            message: "Appointment updated successfully",
            data: formattedAppointment
        });
    }
    catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).json({
            error: "An unexpected error occurred. Please try again later."
        });
    }
});
exports.default = updateAppointment;
