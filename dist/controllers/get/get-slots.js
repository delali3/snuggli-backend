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
exports.getAvailableSlots = void 0;
const db_config_1 = require("../../db/db_config");
const dayjs_1 = __importDefault(require("dayjs"));
// Get available time slots
const getAvailableSlots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;
        if (!doctorId || !date) {
            return res.status(400).json({ error: 'Doctor ID and date are required' });
        }
        // Get doctor's availability
        const { data: doctor, error: doctorError } = yield db_config_1.supabase
            .from('doctor_profiles')
            .select('availability')
            .eq('id', doctorId)
            .single();
        if (doctorError || !doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        const requestedDate = (0, dayjs_1.default)(date);
        const dayOfWeek = requestedDate.day();
        // Get doctor's schedule for the requested day
        const daySchedule = doctor.availability.find((schedule) => schedule.dayOfWeek === dayOfWeek);
        if (!daySchedule) {
            return res.status(200).json([]);
        }
        // Get existing appointments for the requested date
        const { data: existingAppointments, error: appointmentsError } = yield db_config_1.supabase
            .from('appointments')
            .select('date_time')
            .eq('doctor_id', doctorId)
            .eq('status', 'upcoming')
            .gte('date_time', requestedDate.startOf('day').toISOString())
            .lte('date_time', requestedDate.endOf('day').toISOString());
        if (appointmentsError)
            throw appointmentsError;
        // Generate time slots
        const slots = [];
        const startTime = (0, dayjs_1.default)(`${date}T${daySchedule.startTime}`);
        const endTime = (0, dayjs_1.default)(`${date}T${daySchedule.endTime}`);
        const slotDuration = 30; // 30 minutes per slot
        let currentSlot = startTime;
        while (currentSlot.isBefore(endTime)) {
            const slotEnd = currentSlot.add(slotDuration, 'minute');
            const isBooked = existingAppointments === null || existingAppointments === void 0 ? void 0 : existingAppointments.some(app => (0, dayjs_1.default)(app.date_time).isSame(currentSlot));
            slots.push({
                id: currentSlot.format('HH:mm'),
                startTime: currentSlot.format('HH:mm'),
                endTime: slotEnd.format('HH:mm'),
                isAvailable: !isBooked
            });
            currentSlot = slotEnd;
        }
        return res.status(200).json(slots);
    }
    catch (error) {
        console.error('Error fetching available slots:', error);
        return res.status(500).json({ error: 'Failed to fetch available slots' });
    }
});
exports.getAvailableSlots = getAvailableSlots;
exports.default = exports.getAvailableSlots;
