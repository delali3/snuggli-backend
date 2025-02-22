// routes/general.ts
import register from "../controllers/post/register";
import express from "express";
import login from "../controllers/post/login";
import getProfile from "../controllers/get/profile";
import { authMiddleware } from "../middleware/auth.middleware";
import updateProfile from "../controllers/update/profile";
import updateProfileImage from "../controllers/update/profileimage";
import getSessionMessages from "../controllers/get/session-messages";
import chatConsultation from "../controllers/post/consultation";
import getSessionSummary from "../controllers/get/summary";
import getSessions from "../controllers/get/sessions";
import startSession from "../controllers/post/start-session";
import { completeSession } from "../controllers/post/completesession";
import getDoctors from "../controllers/get/get-doctors";
import getAvailableSlots from "../controllers/get/get-slots";
import getAppointments from "../controllers/get/appointment";
import scheduleAppointment from "../controllers/get/schedule";
import { cancelAppointment } from "../controllers/update/cancelappointment";
import { rescheduleAppointment } from "../controllers/update/rescheduleappointment";
import doctorController from '../controllers/get/get-doctor-appointments';
import consultationNotesController from "../controllers/get/consultationcontroller";
import updateAppointment from "../controllers/update/appointment";
import patientConsultationController from "../controllers/get/patient-consultation-notes.controller";
// @ts-ignore
const NODE_ENV = process.env.NODE_ENV === "production" ? "production" : "development";

const router = express.Router();

// Auth & Profile Routes
router.post("/login", login);
router.post("/register", register);
router.get('/patient/profile', authMiddleware, getProfile);
router.put('/patient/profile', authMiddleware, updateProfile);
router.put('/patient/profile/image', authMiddleware, updateProfileImage);

//Patient Consultation Routes
router.get('/patient/consultation/sessions', authMiddleware, getSessions);
router.post('/patient/consultation/sessions', authMiddleware, startSession);
router.put('/patient/consultation/sessions/:sessionId/complete', authMiddleware, completeSession);
router.get('/patient/consultation/sessions/:sessionId/messages', authMiddleware, getSessionMessages);
router.post('/patient/consultation/chat', authMiddleware, chatConsultation);
router.get('/patient/consultation/sessions/:sessionId/summary', authMiddleware, getSessionSummary);

// Patient Appointment Routes
router.get('/patient/appointments/doctors', getDoctors);
router.get('/patient/consultation/doctors/:doctorId/slots', getAvailableSlots);
router.get('/patient/appointments/doctors/:doctorId/slots', getAvailableSlots);
router.get('/patient/appointments', authMiddleware, getAppointments);
router.post('/patient/appointments', authMiddleware, scheduleAppointment);
router.put('/patient/appointments/:appointmentId/cancel', authMiddleware, cancelAppointment);
router.put('/patient/appointments/:appointmentId', authMiddleware, updateAppointment);
router.put('/patient/appointments/:appointmentId/reschedule', authMiddleware, rescheduleAppointment);


// patient consultation notes
router.get('/patient/consultation-notes', authMiddleware, patientConsultationController.getAllConsultationNotes);
router.get('patient/consultation-notes/:consultationId', authMiddleware, patientConsultationController.getConsultationNoteById);



// Doctors Appointment routes
router.get('/doctor/appointments', authMiddleware, doctorController.getDoctorAppointments);
router.get('/doctor/appointments/:date', authMiddleware, doctorController.getDoctorAppointmentsByDate);
router.put('/doctor/appointments/:appointmentId/status', authMiddleware, doctorController.updateAppointmentStatus);
router.post('/doctor/appointments/:appointmentId/notes', authMiddleware, doctorController.saveConsultationNotes);
router.get('/doctor/appointments/:appointmentId/summary', authMiddleware, doctorController.getConsultationSummary);
router.get('/doctor/patients/:patientId/consultations', authMiddleware, doctorController.getPatientConsultationHistory);


// Availability routes
router.get('/doctor/slots', authMiddleware, doctorController.getAvailableSlots);
router.get('/doctor/availability', authMiddleware, doctorController.getDoctorAvailability);
router.put('/doctor/availability', authMiddleware, doctorController.updateAvailability);
router.post('/doctor/slots/block', authMiddleware, doctorController.blockTimeSlot);

router.delete('/doctor/vacation/:id', authMiddleware, doctorController.deleteVacationDays);
router.post('/doctor/vacation', authMiddleware, doctorController.setVacationDays);
router.get('/doctor/vacation', authMiddleware, doctorController.getVacationDays);


//Doctor Consultation Notes
router.get('/doctor/consultation-notes', authMiddleware, consultationNotesController.getAllConsultationNotes);
router.get('/doctor/consultation-notes/:consultationId', authMiddleware, consultationNotesController.getConsultationNoteById);
router.put('/doctor/consultation-notes/:consultationId', authMiddleware, consultationNotesController.updateConsultationNotes);


// Profile and patient routes
router.get('/doctor/profile', authMiddleware, doctorController.getDoctorProfile);
router.get('/doctor/patients/:patientId/history', authMiddleware, doctorController.getPatientHistory);

export default router;