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
exports.getAppointments = void 0;
const db_config_1 = require("../../db/db_config");
// Get user's appointments
const getAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { data: appointments, error } = yield db_config_1.supabase
            .from('appointments')
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
            .eq('patient_id', userId)
            .order('date_time', { ascending: false });
        if (error)
            throw error;
        const formattedAppointments = appointments.map(apt => ({
            id: apt.id,
            doctorId: apt.doctor_profiles.id,
            doctorName: `Dr. ${apt.doctor_profiles.users.first_name} ${apt.doctor_profiles.users.last_name}`,
            specialization: apt.doctor_profiles.specialization,
            dateTime: apt.date_time,
            status: apt.status,
            notes: apt.notes,
            consultationFee: apt.doctor_profiles.consultation_fee
        }));
        return res.status(200).json(formattedAppointments);
    }
    catch (error) {
        console.error('Error fetching appointments:', error);
        return res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});
exports.getAppointments = getAppointments;
exports.default = exports.getAppointments;
