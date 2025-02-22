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
const getDoctorAppointmentsByDate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const doctorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { date } = req.params;
        if (!doctorId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const startOfDay = `${date}T00:00:00Z`;
        const endOfDay = `${date}T23:59:59Z`;
        const { data: appointments, error } = yield db_config_1.supabase
            .from('appointments')
            .select(`
        *,
        users!inner(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
            .eq('doctor_id', doctorId)
            .gte('date_time', startOfDay)
            .lte('date_time', endOfDay)
            .order('date_time', { ascending: true });
        if (error)
            throw error;
        const formattedAppointments = appointments.map(apt => ({
            id: apt.id,
            date_time: apt.date_time,
            status: apt.status || 'upcoming',
            consultation_type: apt.consultation_type || 'checkup',
            consultation_fee: apt.consultation_fee || 0,
            notes: apt.notes,
            symptoms: apt.symptoms,
            patient: {
                id: apt.users.id,
                first_name: apt.users.first_name,
                last_name: apt.users.last_name,
                email: apt.users.email,
                phone: apt.users.phone
            }
        }));
        return res.status(200).json(formattedAppointments);
    }
    catch (error) {
        console.error('Error fetching doctor appointments:', error);
        return res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});
exports.default = getDoctorAppointmentsByDate;
