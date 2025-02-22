"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/general.ts
const register_1 = __importDefault(require("../controllers/post/register"));
const express_1 = __importDefault(require("express"));
const login_1 = __importDefault(require("../controllers/post/login"));
const profile_1 = __importDefault(require("../controllers/get/profile"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const profile_2 = __importDefault(require("../controllers/update/profile"));
const profileimage_1 = __importDefault(require("../controllers/update/profileimage"));
const session_messages_1 = __importDefault(require("../controllers/get/session-messages"));
const consultation_1 = __importDefault(require("../controllers/post/consultation"));
const summary_1 = __importDefault(require("../controllers/get/summary"));
const sessions_1 = __importDefault(require("../controllers/get/sessions"));
const start_session_1 = __importDefault(require("../controllers/post/start-session"));
const completesession_1 = require("../controllers/post/completesession");
const get_doctors_1 = __importDefault(require("../controllers/get/get-doctors"));
const get_slots_1 = __importDefault(require("../controllers/get/get-slots"));
const appointment_1 = __importDefault(require("../controllers/get/appointment"));
const schedule_1 = __importDefault(require("../controllers/get/schedule"));
const cancelappointment_1 = require("../controllers/update/cancelappointment");
const rescheduleappointment_1 = require("../controllers/update/rescheduleappointment");
const get_doctor_appointments_1 = __importDefault(require("../controllers/get/get-doctor-appointments"));
const consultationcontroller_1 = __importDefault(require("../controllers/get/consultationcontroller"));
const appointment_2 = __importDefault(require("../controllers/update/appointment"));
const patient_consultation_notes_controller_1 = __importDefault(require("../controllers/get/patient-consultation-notes.controller"));
// @ts-ignore
const NODE_ENV = process.env.NODE_ENV === "production" ? "production" : "development";
const router = express_1.default.Router();
// Auth & Profile Routes
router.post("/login", login_1.default);
router.post("/register", register_1.default);
router.get('/patient/profile', auth_middleware_1.authMiddleware, profile_1.default);
router.put('/patient/profile', auth_middleware_1.authMiddleware, profile_2.default);
router.put('/patient/profile/image', auth_middleware_1.authMiddleware, profileimage_1.default);
//Patient Consultation Routes
router.get('/patient/consultation/sessions', auth_middleware_1.authMiddleware, sessions_1.default);
router.post('/patient/consultation/sessions', auth_middleware_1.authMiddleware, start_session_1.default);
router.put('/patient/consultation/sessions/:sessionId/complete', auth_middleware_1.authMiddleware, completesession_1.completeSession);
router.get('/patient/consultation/sessions/:sessionId/messages', auth_middleware_1.authMiddleware, session_messages_1.default);
router.post('/patient/consultation/chat', auth_middleware_1.authMiddleware, consultation_1.default);
router.get('/patient/consultation/sessions/:sessionId/summary', auth_middleware_1.authMiddleware, summary_1.default);
// Patient Appointment Routes
router.get('/patient/appointments/doctors', get_doctors_1.default);
router.get('/patient/consultation/doctors/:doctorId/slots', get_slots_1.default);
router.get('/patient/appointments/doctors/:doctorId/slots', get_slots_1.default);
router.get('/patient/appointments', auth_middleware_1.authMiddleware, appointment_1.default);
router.post('/patient/appointments', auth_middleware_1.authMiddleware, schedule_1.default);
router.put('/patient/appointments/:appointmentId/cancel', auth_middleware_1.authMiddleware, cancelappointment_1.cancelAppointment);
router.put('/patient/appointments/:appointmentId', auth_middleware_1.authMiddleware, appointment_2.default);
router.put('/patient/appointments/:appointmentId/reschedule', auth_middleware_1.authMiddleware, rescheduleappointment_1.rescheduleAppointment);
// patient consultation notes
router.get('/patient/consultation-notes', auth_middleware_1.authMiddleware, patient_consultation_notes_controller_1.default.getAllConsultationNotes);
router.get('patient/consultation-notes/:consultationId', auth_middleware_1.authMiddleware, patient_consultation_notes_controller_1.default.getConsultationNoteById);
// Doctors Appointment routes
router.get('/doctor/appointments', auth_middleware_1.authMiddleware, get_doctor_appointments_1.default.getDoctorAppointments);
router.get('/doctor/appointments/:date', auth_middleware_1.authMiddleware, get_doctor_appointments_1.default.getDoctorAppointmentsByDate);
router.put('/doctor/appointments/:appointmentId/status', auth_middleware_1.authMiddleware, get_doctor_appointments_1.default.updateAppointmentStatus);
router.post('/doctor/appointments/:appointmentId/notes', auth_middleware_1.authMiddleware, get_doctor_appointments_1.default.saveConsultationNotes);
router.get('/doctor/appointments/:appointmentId/summary', auth_middleware_1.authMiddleware, get_doctor_appointments_1.default.getConsultationSummary);
router.get('/doctor/patients/:patientId/consultations', auth_middleware_1.authMiddleware, get_doctor_appointments_1.default.getPatientConsultationHistory);
// Availability routes
router.get('/doctor/slots', auth_middleware_1.authMiddleware, get_doctor_appointments_1.default.getAvailableSlots);
router.get('/doctor/availability', auth_middleware_1.authMiddleware, get_doctor_appointments_1.default.getDoctorAvailability);
router.put('/doctor/availability', auth_middleware_1.authMiddleware, get_doctor_appointments_1.default.updateAvailability);
router.post('/doctor/slots/block', auth_middleware_1.authMiddleware, get_doctor_appointments_1.default.blockTimeSlot);
router.delete('/doctor/vacation/:id', auth_middleware_1.authMiddleware, get_doctor_appointments_1.default.deleteVacationDays);
router.post('/doctor/vacation', auth_middleware_1.authMiddleware, get_doctor_appointments_1.default.setVacationDays);
router.get('/doctor/vacation', auth_middleware_1.authMiddleware, get_doctor_appointments_1.default.getVacationDays);
//Doctor Consultation Notes
router.get('/doctor/consultation-notes', auth_middleware_1.authMiddleware, consultationcontroller_1.default.getAllConsultationNotes);
router.get('/doctor/consultation-notes/:consultationId', auth_middleware_1.authMiddleware, consultationcontroller_1.default.getConsultationNoteById);
router.put('/doctor/consultation-notes/:consultationId', auth_middleware_1.authMiddleware, consultationcontroller_1.default.updateConsultationNotes);
// Profile and patient routes
router.get('/doctor/profile', auth_middleware_1.authMiddleware, get_doctor_appointments_1.default.getDoctorProfile);
router.get('/doctor/patients/:patientId/history', auth_middleware_1.authMiddleware, get_doctor_appointments_1.default.getPatientHistory);
exports.default = router;
