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
exports.cancelAppointment = void 0;
const db_config_1 = require("../../db/db_config");
// Cancel appointment
const cancelAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { appointmentId } = req.params;
        if (!userId || !appointmentId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Verify appointment belongs to user
        const { data: appointment, error: checkError } = yield db_config_1.supabase
            .from('appointments')
            .select('id, status')
            .eq('id', appointmentId)
            .eq('patient_id', userId)
            .single();
        if (checkError) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        if (appointment.status !== 'upcoming') {
            return res.status(400).json({ error: 'Can only cancel upcoming appointments' });
        }
        // Cancel appointment
        const { error: updateError } = yield db_config_1.supabase
            .from('appointments')
            .update({ status: 'cancelled' })
            .eq('id', appointmentId);
        if (updateError)
            throw updateError;
        return res.status(200).json({ message: 'Appointment cancelled successfully' });
    }
    catch (error) {
        console.error('Error cancelling appointment:', error);
        return res.status(500).json({ error: 'Failed to cancel appointment' });
    }
});
exports.cancelAppointment = cancelAppointment;
