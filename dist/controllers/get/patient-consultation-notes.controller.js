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
const patientConsultationController = {
    getAllConsultationNotes: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            console.log("Fetching consultations for user:", userId);
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const { data: consultations, error: consultationsError } = yield db_config_1.supabase
                .from("consultation_notes")
                .select(`
          id,
          diagnosis,
          prescription,
          additional_notes,
          follow_up_date,
          created_at,
          updated_at,
          meeting_link,
          consultation_symptoms (
            id,
            symptoms
          ),
          appointments!inner (
            id,
            date_time,
            status,
            priority,
            type,
            patient_id,
            doctor_profiles!inner (
              id,
              specialization,
              users (
                id,
                first_name,
                last_name,
                profile_image
              )
            )
          )
        `)
                .eq("appointments.patient_id", userId)
                .order("created_at", { ascending: false })
                .returns();
            if (consultationsError) {
                console.error("Error fetching consultations:", consultationsError);
                throw consultationsError;
            }
            console.log("Raw consultations data:", JSON.stringify(consultations, null, 2));
            // Format the consultations data
            const formattedConsultations = consultations.map((note) => {
                var _a, _b;
                // Parse symptoms from consultation_symptoms
                const symptomsData = (_b = (_a = note.consultation_symptoms) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.symptoms;
                let parsedSymptoms = [];
                if (symptomsData) {
                    try {
                        if (typeof symptomsData === 'string') {
                            if (symptomsData.startsWith('{') && symptomsData.endsWith('}')) {
                                parsedSymptoms = symptomsData
                                    .slice(1, -1)
                                    .split(',')
                                    .map(s => s.replace(/^"(.*)"$/, '$1').trim())
                                    .filter(Boolean);
                            }
                            else {
                                parsedSymptoms = [symptomsData];
                            }
                        }
                        else if (Array.isArray(symptomsData)) {
                            parsedSymptoms = symptomsData;
                        }
                    }
                    catch (e) {
                        console.error('Error parsing symptoms:', e, symptomsData);
                        parsedSymptoms = [];
                    }
                }
                return {
                    id: note.id,
                    doctorId: note.appointments.doctor_profiles.id,
                    doctorName: `${note.appointments.doctor_profiles.users.first_name} ${note.appointments.doctor_profiles.users.last_name}`,
                    doctorSpecialization: note.appointments.doctor_profiles.specialization,
                    doctorImage: note.appointments.doctor_profiles.users.profile_image,
                    dateTime: note.appointments.date_time,
                    status: note.appointments.status,
                    priority: note.appointments.priority,
                    symptoms: parsedSymptoms,
                    diagnosis: note.diagnosis,
                    prescription: note.prescription,
                    additionalNotes: note.additional_notes,
                    meeting_link: note.meeting_link,
                    followUpDate: note.follow_up_date,
                    lastUpdated: note.updated_at
                };
            });
            return res.status(200).json({ data: formattedConsultations });
        }
        catch (error) {
            console.error("Error in getAllConsultationNotes:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }),
    getConsultationNoteById: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { consultationId } = req.params;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const { data: consultation, error: consultationError } = yield db_config_1.supabase
                .from("consultation_notes")
                .select(`
          id,
          diagnosis,
          prescription,
          additional_notes,
          follow_up_date,
          created_at,
          updated_at,
          meeting_link,
          consultation_symptoms (
            id,
            symptoms
          ),
          appointments!inner (
            id,
            date_time,
            status,
            priority,
            type,
            patient_id,
            doctor_profiles!inner (
              id,
              specialization,
              users (
                id,
                first_name,
                last_name,
                profile_image
              )
            )
          )
        `)
                .eq("id", consultationId)
                .single();
            if (consultationError) {
                console.error("Error fetching consultation:", consultationError);
                return res.status(404).json({ error: "Consultation not found" });
            }
            // Verify the consultation belongs to the patient
            if (consultation.appointments.patient_id !== userId) {
                return res.status(403).json({ error: "Not authorized to view this consultation" });
            }
            // Parse symptoms
            const symptomsData = (_c = (_b = consultation.consultation_symptoms) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.symptoms;
            let parsedSymptoms = [];
            if (symptomsData) {
                try {
                    if (typeof symptomsData === 'string') {
                        if (symptomsData.startsWith('{') && symptomsData.endsWith('}')) {
                            parsedSymptoms = symptomsData
                                .slice(1, -1)
                                .split(',')
                                .map(s => s.replace(/^"(.*)"$/, '$1').trim())
                                .filter(Boolean);
                        }
                        else {
                            parsedSymptoms = [symptomsData];
                        }
                    }
                    else if (Array.isArray(symptomsData)) {
                        parsedSymptoms = symptomsData;
                    }
                }
                catch (e) {
                    console.error('Error parsing symptoms:', e, symptomsData);
                    parsedSymptoms = [];
                }
            }
            const formattedConsultation = {
                id: consultation.id,
                doctorId: consultation.appointments.doctor_profiles.id,
                doctorName: `${consultation.appointments.doctor_profiles.users.first_name} ${consultation.appointments.doctor_profiles.users.last_name}`,
                doctorSpecialization: consultation.appointments.doctor_profiles.specialization,
                doctorImage: consultation.appointments.doctor_profiles.users.profile_image,
                dateTime: consultation.appointments.date_time,
                status: consultation.appointments.status,
                priority: consultation.appointments.priority,
                symptoms: parsedSymptoms,
                diagnosis: consultation.diagnosis,
                prescription: consultation.prescription,
                additionalNotes: consultation.additional_notes,
                meeting_link: consultation.meeting_link,
                followUpDate: consultation.follow_up_date,
                lastUpdated: consultation.updated_at
            };
            return res.status(200).json({ data: formattedConsultation });
        }
        catch (error) {
            console.error("Error in getConsultationNoteById:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    })
};
exports.default = patientConsultationController;
