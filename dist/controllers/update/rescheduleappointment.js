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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rescheduleAppointment = void 0;
const db_config_1 = require("../../db/db_config");
const dayjs_1 = __importDefault(require("dayjs"));
// Reschedule appointment
const rescheduleAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { appointmentId } = req.params;
        const { dateTime } = req.body;
        if (!userId || !appointmentId || !dateTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Verify appointment belongs to user and is upcoming
        const { data: appointment, error: checkError } = yield db_config_1.supabase
            .from('appointments')
            .select('id, doctor_id, status')
            .eq('id', appointmentId)
            .eq('patient_id', userId)
            .single();
        if (checkError) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        if (appointment.status !== 'upcoming') {
            return res.status(400).json({ error: 'Can only reschedule upcoming appointments' });
        }
        // Check if new slot is available
        const newTime = (0, dayjs_1.default)(dateTime);
        const { data: existingAppointment, error: slotCheckError } = yield db_config_1.supabase
            .from('appointments')
            .select('id')
            .eq('doctor_id', appointment.doctor_id)
            .eq('status', 'upcoming')
            .eq('date_time', newTime.toISOString())
            .single();
        if (slotCheckError && slotCheckError.code !== 'PGRST116') {
            throw slotCheckError;
        }
        if (existingAppointment) {
            return res.status(409).json({ error: 'New time slot is not available' });
        }
        // Update appointment
        const { data: updatedAppointment, error: updateError } = yield db_config_1.supabase
            .from('appointments')
            .update({ date_time: newTime.toISOString() })
            .eq('id', appointmentId)
            .select(`
          *,
          doctor_profiles!inner(
            id,
            specialization,
            users!inner(
              first_name,
              last_name
            )
          )
        `)
            .single();
        if (updateError)
            throw updateError;
        const formattedAppointment = {
            id: updatedAppointment.id,
            doctorId: updatedAppointment.doctor_profiles.id,
            doctorName: `Dr. ${updatedAppointment.doctor_profiles.users.first_name} ${updatedAppointment.doctor_profiles.users.last_name}`,
            specialization: updatedAppointment.doctor_profiles.specialization,
            dateTime: updatedAppointment.date_time,
            status: updatedAppointment.status,
            notes: updatedAppointment.notes
        };
        return res.status(200).json(formattedAppointment);
    }
    catch (error) {
        console.error('Error rescheduling appointment:', error);
        return res.status(500).json({ error: 'Failed to reschedule appointment' });
    }
});
exports.rescheduleAppointment = rescheduleAppointment;
