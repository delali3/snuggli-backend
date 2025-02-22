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
const addAppointmentNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const doctorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { appointmentId } = req.params;
        const { notes } = req.body;
        if (!doctorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { data: appointment, error: fetchError } = yield db_config_1.supabase
            .from('appointments')
            .select('doctor_id')
            .eq('id', appointmentId)
            .single();
        if (fetchError || !appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        if (appointment.doctor_id !== doctorId) {
            return res.status(403).json({ error: 'Not authorized to update this appointment' });
        }
        const { error: updateError } = yield db_config_1.supabase
            .from('appointments')
            .update({
            notes,
            updated_at: new Date().toISOString()
        })
            .eq('id', appointmentId);
        if (updateError) {
            throw updateError;
        }
        return res.status(200).json({ message: 'Appointment notes updated successfully' });
    }
    catch (error) {
        console.error('Error in addAppointmentNotes:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = addAppointmentNotes;
