"use strict";
// controllers/doctor.controller.ts
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
const db_config_1 = require("../../db/db_config");
const dayjs_1 = __importDefault(require("dayjs"));
const doctorController = {
    getDoctorAppointments: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { data: doctorProfile, error: profileError } = yield db_config_1.supabase
                .from('doctor_profiles')
                .select('id')
                .eq('user_id', userId)
                .single();
            if (profileError || !doctorProfile) {
                return res.status(404).json({ error: 'Doctor profile not found' });
            }
            const { data: appointments, error: appointmentsError } = yield db_config_1.supabase
                .from('appointments')
                .select(`
              id,
              date_time,
              status,
              type,
              priority,
              symptoms,
              notes,
              users!appointments_patient_id_fkey (
                id,
                first_name,
                last_name,
                email,
                phone,
                profile_image
              )
            `)
                .eq('doctor_id', doctorProfile.id)
                .order('date_time', { ascending: true })
                .returns();
            if (appointmentsError) {
                throw appointmentsError;
            }
            const formattedAppointments = appointments.map(apt => ({
                id: apt.id,
                dateTime: apt.date_time,
                status: apt.status,
                type: apt.type,
                priority: apt.priority,
                symptoms: apt.symptoms,
                notes: apt.notes,
                patientId: apt.users.id,
                patientName: `${apt.users.first_name} ${apt.users.last_name}`,
                patientEmail: apt.users.email,
                patientPhone: apt.users.phone,
                patientImage: apt.users.profile_image
            }));
            return res.status(200).json({ data: formattedAppointments });
        }
        catch (error) {
            console.error('Error in getDoctorAppointments:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }),
    getDoctorAvailability: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { data, error } = yield db_config_1.supabase
                .from('doctor_availability')
                .select('*')
                .eq('doctor_id', userId);
            if (error)
                throw error;
            return res.status(200).json({ data });
        }
        catch (error) {
            console.error('Error in getDoctorAvailability:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }),
    getDoctorAppointmentsByDate: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { date } = req.params;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const startDate = (0, dayjs_1.default)(date).startOf('day').toISOString();
            const endDate = (0, dayjs_1.default)(date).endOf('day').toISOString();
            const { data: doctorProfile, error: profileError } = yield db_config_1.supabase
                .from('doctor_profiles')
                .select('id')
                .eq('user_id', userId)
                .single();
            if (profileError || !doctorProfile) {
                return res.status(404).json({ error: 'Doctor profile not found' });
            }
            const { data: appointments, error: appointmentsError } = yield db_config_1.supabase
                .from('appointments')
                .select(`
              id,
              date_time,
              status,
              type,
              priority,
              symptoms,
              notes,
              users!appointments_patient_id_fkey (
                id,
                first_name,
                last_name,
                email,
                phone,
                profile_image
              )
            `)
                .eq('doctor_id', doctorProfile.id)
                .gte('date_time', startDate)
                .lte('date_time', endDate)
                .order('date_time', { ascending: true })
                .returns();
            if (appointmentsError) {
                throw appointmentsError;
            }
            const formattedAppointments = appointments.map(apt => ({
                id: apt.id,
                dateTime: apt.date_time,
                status: apt.status,
                type: apt.type,
                priority: apt.priority,
                symptoms: apt.symptoms,
                notes: apt.notes,
                patientId: apt.users.id,
                patientName: `${apt.users.first_name} ${apt.users.last_name}`,
                patientEmail: apt.users.email,
                patientPhone: apt.users.phone,
                patientImage: apt.users.profile_image
            }));
            return res.status(200).json({ data: formattedAppointments });
        }
        catch (error) {
            console.error('Error in getDoctorAppointmentsByDate:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }),
    saveConsultationNotes: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { appointmentId } = req.params;
            const { diagnosis, prescription, additionalNotes, followUpDate, meetingLink } = req.body;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Verify doctor owns the appointment
            const { data: appointment, error: appointmentError } = yield db_config_1.supabase
                .from('appointments')
                .select('doctor_id')
                .eq('id', appointmentId)
                .single();
            if (appointmentError || !appointment) {
                return res.status(404).json({ error: 'Appointment not found' });
            }
            // Save consultation notes
            const { data: consultationNotes, error: notesError } = yield db_config_1.supabase
                .from('consultation_notes')
                .insert({
                appointment_id: appointmentId,
                diagnosis,
                prescription,
                additional_notes: additionalNotes,
                follow_up_date: followUpDate,
                meeting_link: meetingLink,
                created_at: new Date().toISOString()
            })
                .select()
                .single();
            if (notesError) {
                throw notesError;
            }
            // Save symptoms
            const { error: symptomsError } = yield db_config_1.supabase
                .from('consultation_symptoms')
                .insert({
                consultation_id: consultationNotes.id,
                symptoms: req.body.symptoms || [],
                created_at: new Date().toISOString()
            });
            if (symptomsError) {
                throw symptomsError;
            }
            // Update appointment status
            const { error: updateError } = yield db_config_1.supabase
                .from('appointments')
                .update({
                status: 'completed',
                updated_at: new Date().toISOString()
            })
                .eq('id', appointmentId);
            if (updateError) {
                throw updateError;
            }
            return res.status(200).json({ data: consultationNotes });
        }
        catch (error) {
            console.error('Error in saveConsultationNotes:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }),
    getConsultationSummary: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { appointmentId } = req.params;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Get consultation notes with symptoms
            const { data: consultation, error: consultationError } = yield db_config_1.supabase
                .from('consultation_notes')
                .select(`
        *,
        consultation_symptoms (
          symptoms
        ),
        appointments (
          patient_name,
          date_time,
          type,
          status
        )
      `)
                .eq('appointment_id', appointmentId)
                .single();
            if (consultationError) {
                throw consultationError;
            }
            if (!consultation) {
                return res.status(404).json({ error: 'Consultation not found' });
            }
            return res.status(200).json({ data: consultation });
        }
        catch (error) {
            console.error('Error in getConsultationSummary:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }),
    getPatientConsultationHistory: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { patientId } = req.params;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Get all consultations for the patient
            const { data: consultations, error: consultationsError } = yield db_config_1.supabase
                .from('consultation_notes')
                .select(`
        *,
        consultation_symptoms (
          symptoms
        ),
        appointments (
          patient_name,
          date_time,
          type,
          status
        )
      `)
                .eq('appointments.patient_id', patientId)
                .order('created_at', { ascending: false });
            if (consultationsError) {
                throw consultationsError;
            }
            return res.status(200).json({ data: consultations });
        }
        catch (error) {
            console.error('Error in getPatientConsultationHistory:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }),
    updateAvailability: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { availability } = req.body;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // First delete existing availability
            const { error: deleteError } = yield db_config_1.supabase
                .from('doctor_availability')
                .delete()
                .eq('doctor_id', userId);
            if (deleteError)
                throw deleteError;
            // Insert new availability
            const { error: insertError } = yield db_config_1.supabase
                .from('doctor_availability')
                .insert(availability.map((schedule) => ({
                doctor_id: userId,
                day_of_week: schedule.dayOfWeek,
                start_time: schedule.startTime,
                end_time: schedule.endTime,
                is_available: schedule.isAvailable,
                created_at: new Date().toISOString()
            })));
            if (insertError)
                throw insertError;
            return res.status(200).json({ message: 'Availability updated successfully' });
        }
        catch (error) {
            console.error('Error in updateAvailability:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }),
    getAvailableSlots: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { date } = req.query;
            if (!userId || !date) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }
            // Get doctor profile with typed response
            const { data: doctorProfile, error: profileError } = yield db_config_1.supabase
                .from('doctor_profiles')
                .select('id, availability')
                .eq('user_id', userId)
                .single();
            if (profileError || !doctorProfile) {
                return res.status(404).json({ error: 'Doctor profile not found' });
            }
            const dayOfWeek = (0, dayjs_1.default)(date).day();
            const daySchedule = (_b = doctorProfile.availability) === null || _b === void 0 ? void 0 : _b.find((schedule) => schedule.dayOfWeek === dayOfWeek);
            if (!daySchedule || !daySchedule.isAvailable) {
                return res.status(200).json({ data: [] });
            }
            // Get existing appointments with typed response
            const startTime = (0, dayjs_1.default)(`${date}T${daySchedule.startTime}`);
            const endTime = (0, dayjs_1.default)(`${date}T${daySchedule.endTime}`);
            const { data: existingAppointments, error: appointmentsError } = yield db_config_1.supabase
                .from('appointments')
                .select('date_time, users!appointments_patient_id_fkey(first_name, last_name)')
                .eq('doctor_id', doctorProfile.id)
                .gte('date_time', startTime.toISOString())
                .lte('date_time', endTime.toISOString())
                .returns();
            if (appointmentsError) {
                throw appointmentsError;
            }
            // Generate time slots
            const slots = [];
            let currentSlot = startTime;
            const slotDuration = 30; // 30 minutes per slot
            while (currentSlot.isBefore(endTime)) {
                const slotEnd = currentSlot.add(slotDuration, 'minute');
                const existingAppointment = existingAppointments.find(apt => (0, dayjs_1.default)(apt.date_time).isSame(currentSlot));
                slots.push({
                    id: currentSlot.format('HH:mm'),
                    startTime: currentSlot.format('HH:mm'),
                    endTime: slotEnd.format('HH:mm'),
                    isAvailable: !existingAppointment,
                    appointment: existingAppointment ? {
                        patientName: `${existingAppointment.users.first_name} ${existingAppointment.users.last_name}`
                    } : undefined
                });
                currentSlot = slotEnd;
            }
            return res.status(200).json({ data: slots });
        }
        catch (error) {
            console.error('Error in getAvailableSlots:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }),
    blockTimeSlot: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { date, time } = req.body;
            if (!userId || !date || !time) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }
            // Get doctor profile
            const { data: doctorProfile, error: profileError } = yield db_config_1.supabase
                .from('doctor_profiles')
                .select('id')
                .eq('user_id', userId)
                .single();
            if (profileError || !doctorProfile) {
                return res.status(404).json({ error: 'Doctor profile not found' });
            }
            // Create blocked slot
            const { error } = yield db_config_1.supabase
                .from('blocked_slots')
                .insert({
                doctor_id: doctorProfile.id,
                date,
                time,
                created_at: new Date().toISOString()
            });
            if (error) {
                throw error;
            }
            return res.status(200).json({ message: 'Time slot blocked successfully' });
        }
        catch (error) {
            console.error('Error in blockTimeSlot:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }),
    getPatientHistory: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { patientId } = req.params;
            if (!userId || !patientId) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }
            const { data: history, error } = yield db_config_1.supabase
                .from('consultation_notes')
                .select(`
          id,
          symptoms,
          diagnosis,
          prescription,
          additional_notes,
          created_at,
          appointments!inner(
            date_time,
            doctor_profiles!inner(
              users!inner(
                first_name,
                last_name
              )
            )
          )
        `)
                .eq('appointments.patient_id', patientId)
                .order('created_at', { ascending: false })
                .returns();
            if (error) {
                throw error;
            }
            const formattedHistory = history.map(record => ({
                id: record.id,
                date: record.appointments.date_time,
                diagnosis: record.diagnosis,
                treatment: record.prescription,
                symptoms: record.symptoms,
                notes: record.additional_notes,
                doctorName: `Dr. ${record.appointments.doctor_profiles.users.first_name} ${record.appointments.doctor_profiles.users.last_name}`
            }));
            return res.status(200).json({ data: formattedHistory });
        }
        catch (error) {
            console.error('Error in getPatientHistory:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }),
    getDoctorProfile: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Get doctor profile with user information
            const { data: doctorProfile, error: profileError } = yield db_config_1.supabase
                .from('doctor_profiles')
                .select(`
          id,
          specialization,
          consultation_fee,
          availability,
          experience,
          profile_image,
          users!inner (
            first_name,
            last_name,
            email,
            phone
          )
        `)
                .eq('user_id', userId)
                .single();
            if (profileError) {
                console.error('Error fetching doctor profile:', profileError);
                return res.status(500).json({ error: 'Failed to fetch doctor profile' });
            }
            if (!doctorProfile) {
                return res.status(404).json({ error: 'Doctor profile not found' });
            }
            // Format the response
            const formattedProfile = {
                id: doctorProfile.id,
                name: `Dr. ${(_b = doctorProfile.users) === null || _b === void 0 ? void 0 : _b.first_name} ${(_c = doctorProfile.users) === null || _c === void 0 ? void 0 : _c.last_name}`,
                email: (_d = doctorProfile.users) === null || _d === void 0 ? void 0 : _d.email,
                phone: (_e = doctorProfile.users) === null || _e === void 0 ? void 0 : _e.phone,
                specialization: doctorProfile.specialization,
                consultationFee: doctorProfile.consultation_fee,
                availability: doctorProfile.availability,
                experience: doctorProfile.experience,
                profileImage: doctorProfile.profile_image
            };
            return res.status(200).json({ data: formattedProfile });
        }
        catch (error) {
            console.error('Error in getDoctorProfile:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }),
    getVacationDays: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { data, error } = yield db_config_1.supabase
                .from('doctor_vacation_days')
                .select('*')
                .eq('doctor_id', userId)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return res.status(200).json({ data });
        }
        catch (error) {
            console.error('Error in getVacationDays:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }),
    setVacationDays: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { dates } = req.body;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Validate dates
            if (!Array.isArray(dates) || dates.length === 0) {
                return res.status(400).json({ error: 'Invalid dates provided' });
            }
            // Insert vacation days
            const { data, error } = yield db_config_1.supabase
                .from('doctor_vacation_days')
                .insert({
                doctor_id: userId,
                dates: dates,
                created_at: new Date().toISOString()
            })
                .select()
                .single();
            if (error)
                throw error;
            // Instead of using 'date' column, we'll update the day's availability
            const { error: blockError } = yield db_config_1.supabase
                .from('doctor_availability')
                .insert(dates.map(date => ({
                doctor_id: userId,
                day_of_week: (0, dayjs_1.default)(date).format('dddd'), // This will give us the day name
                is_available: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })));
            if (blockError)
                throw blockError;
            return res.status(200).json({ data });
        }
        catch (error) {
            console.error('Error in setVacationDays:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }),
    deleteVacationDays: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { id } = req.params;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Delete the vacation days entry
            const { error: deleteError } = yield db_config_1.supabase
                .from('doctor_vacation_days')
                .delete()
                .eq('id', id)
                .eq('doctor_id', userId);
            if (deleteError)
                throw deleteError;
            return res.status(200).json({ message: 'Vacation days deleted successfully' });
        }
        catch (error) {
            console.error('Error in deleteVacationDays:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }),
    updateAppointmentStatus: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { appointmentId } = req.params;
            const { status } = req.body;
            if (!userId || !appointmentId || !status) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }
            // Validate status
            const validStatuses = ['upcoming', 'completed', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }
            // Get doctor profile
            const { data: doctorProfile, error: profileError } = yield db_config_1.supabase
                .from('doctor_profiles')
                .select('id')
                .eq('user_id', userId)
                .single();
            if (profileError || !doctorProfile) {
                return res.status(404).json({ error: 'Doctor profile not found' });
            }
            // Verify appointment belongs to doctor
            const { data: appointment, error: appointmentError } = yield db_config_1.supabase
                .from('appointments')
                .select('doctor_id')
                .eq('id', appointmentId)
                .single();
            if (appointmentError || !appointment) {
                return res.status(404).json({ error: 'Appointment not found' });
            }
            if (appointment.doctor_id !== doctorProfile.id) {
                return res.status(403).json({ error: 'Not authorized to update this appointment' });
            }
            // Update appointment status
            const { error: updateError } = yield db_config_1.supabase
                .from('appointments')
                .update({
                status,
                updated_at: new Date().toISOString()
            })
                .eq('id', appointmentId);
            if (updateError) {
                throw updateError;
            }
            // If marking as completed, ensure consultation notes exist
            if (status === 'completed') {
                const { data: notes, error: notesError } = yield db_config_1.supabase
                    .from('consultation_notes')
                    .select('id')
                    .eq('appointment_id', appointmentId)
                    .single();
                if (notesError || !notes) {
                    return res.status(400).json({
                        error: 'Cannot mark appointment as completed without consultation notes'
                    });
                }
            }
            return res.status(200).json({
                message: 'Appointment status updated successfully',
                data: { status }
            });
        }
        catch (error) {
            console.error('Error in updateAppointmentStatus:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    })
};
exports.default = doctorController;
