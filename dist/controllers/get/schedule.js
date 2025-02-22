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
exports.scheduleAppointment = void 0;
const db_config_1 = require("../../db/db_config");
const dayjs_1 = __importDefault(require("dayjs"));
// Schedule new appointment
const scheduleAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { doctorId, dateTime, notes } = req.body;
        if (!userId || !doctorId || !dateTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Check if slot is still available
        const appointmentTime = (0, dayjs_1.default)(dateTime);
        const { data: existingAppointment, error: checkError } = yield db_config_1.supabase
            .from('appointments')
            .select('id')
            .eq('doctor_id', doctorId)
            .eq('status', 'upcoming')
            .eq('date_time', appointmentTime.toISOString())
            .single();
        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }
        if (existingAppointment) {
            return res.status(409).json({ error: 'Time slot no longer available' });
        }
        // Create appointment
        const { data: appointment, error: createError } = yield db_config_1.supabase
            .from('appointments')
            .insert({
            patient_id: userId,
            doctor_id: doctorId,
            date_time: appointmentTime.toISOString(),
            status: 'upcoming',
            notes
        })
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
        if (createError)
            throw createError;
        const formattedAppointment = {
            id: appointment.id,
            doctorId: appointment.doctor_profiles.id,
            doctorName: `Dr. ${appointment.doctor_profiles.users.first_name} ${appointment.doctor_profiles.users.last_name}`,
            specialization: appointment.doctor_profiles.specialization,
            dateTime: appointment.date_time,
            status: appointment.status,
            notes: appointment.notes
        };
        return res.status(201).json(formattedAppointment);
    }
    catch (error) {
        console.error('Error scheduling appointment:', error);
        return res.status(500).json({ error: 'Failed to schedule appointment' });
    }
});
exports.scheduleAppointment = scheduleAppointment;
exports.default = exports.scheduleAppointment;
