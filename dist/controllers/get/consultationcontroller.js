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
const consultationNotesController = {
    getAllConsultationNotes: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            console.log("User ID:", userId); // Debug log
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            // Get doctor profile
            const { data: doctorProfile, error: profileError } = yield db_config_1.supabase
                .from("doctor_profiles")
                .select("id")
                .eq("user_id", userId)
                .single();
            console.log("Doctor Profile Query:", {
                data: doctorProfile,
                error: profileError,
            }); // Debug log
            if (profileError) {
                console.error("Profile Error:", profileError); // Detailed error log
                return res
                    .status(404)
                    .json({ error: "Doctor profile not found", details: profileError });
            }
            if (!doctorProfile) {
                return res.status(404).json({ error: "Doctor profile not found" });
            }
            // Get all consultation notes with related data
            const { data: consultations, error: consultationsError } = yield db_config_1.supabase
                .from("consultation_notes")
                .select(`
        id,
        appointment_id,
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
          user:users!inner ( 
            id,
            first_name,
            last_name,
            email,
            phone,
            profile_image
          )
        )
      `)
                .eq("appointments.doctor_id", doctorProfile.id)
                .order("created_at", { ascending: false })
                .returns();
            console.log("Consultations Query:", {
                doctorId: doctorProfile.id,
                data: consultations,
                error: consultationsError,
            }); // Debug log
            if (consultationsError) {
                console.error("Consultations Error:", consultationsError); // Detailed error log
                throw consultationsError;
            }
            // In your controller (backend)
            const formattedConsultations = consultations.map((note) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                // Get symptoms from consultation_symptoms
                const symptomsData = (_b = (_a = note.consultation_symptoms) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.symptoms;
                let parsedSymptoms = [];
                if (symptomsData) {
                    try {
                        // Handle PostgreSQL array format (e.g., {"symptom1","symptom2"})
                        if (typeof symptomsData === 'string') {
                            if (symptomsData.startsWith('{') && symptomsData.endsWith('}')) {
                                // Remove the curly braces and split by comma
                                parsedSymptoms = symptomsData
                                    .slice(1, -1) // Remove { and }
                                    .split(',')
                                    .map(s => s.replace(/^"(.*)"$/, '$1').trim()) // Remove quotes and trim
                                    .filter(Boolean); // Remove empty strings
                            }
                            else {
                                // If it's just a regular string, make it an array
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
                // Format consultation notes data
                return {
                    id: note.id,
                    patientId: ((_d = (_c = note.appointments) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.id) || "",
                    patientName: `${((_f = (_e = note.appointments) === null || _e === void 0 ? void 0 : _e.user) === null || _f === void 0 ? void 0 : _f.first_name) || ""} ${((_h = (_g = note.appointments) === null || _g === void 0 ? void 0 : _g.user) === null || _h === void 0 ? void 0 : _h.last_name) || ""}`,
                    dateTime: ((_j = note.appointments) === null || _j === void 0 ? void 0 : _j.date_time) || "",
                    status: ((_k = note.appointments) === null || _k === void 0 ? void 0 : _k.status) || "",
                    priority: ((_l = note.appointments) === null || _l === void 0 ? void 0 : _l.priority) || "",
                    symptoms: parsedSymptoms, // Now it's an array
                    diagnosis: note.diagnosis || "",
                    prescription: note.prescription || "",
                    additionalNotes: note.additional_notes || "",
                    followUpDate: note.follow_up_date || null,
                    lastUpdated: note.updated_at,
                    patientImage: ((_o = (_m = note.appointments) === null || _m === void 0 ? void 0 : _m.user) === null || _o === void 0 ? void 0 : _o.profile_image) || null,
                    meeting_link: note.meeting_link || "",
                };
            });
            return res.status(200).json({ data: formattedConsultations });
        }
        catch (error) {
            // Enhanced error logging
            console.error("Detailed error in getAllConsultationNotes:", {
                error,
                // message: error.message,
                // stack: error.stack
            });
            return res.status(500).json({
                error: "Internal server error",
                // details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }),
    updateConsultationNotes: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { consultationId } = req.params;
            const { symptoms, diagnosis, prescription, additionalNotes, followUpDate, meeting_link, } = req.body;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            // Verify doctor owns the consultation note
            const { data: consultation, error: consultationError } = yield db_config_1.supabase
                .from("consultation_notes")
                .select("appointments!inner(doctor_id, doctor_profiles!inner(user_id))")
                .eq("id", consultationId)
                .single();
            if (consultationError || !consultation) {
                return res.status(404).json({ error: "Consultation not found" });
            }
            // Start with consultation_notes update
            const { error: updateError } = yield db_config_1.supabase
                .from("consultation_notes")
                .update({
                diagnosis,
                prescription,
                additional_notes: additionalNotes,
                follow_up_date: followUpDate,
                meeting_link: meeting_link,
                updated_at: new Date().toISOString(),
            })
                .eq("id", consultationId);
            if (updateError) {
                throw updateError;
            }
            // Format symptoms for PostgreSQL array
            let formattedSymptoms;
            if (Array.isArray(symptoms)) {
                formattedSymptoms = `{${symptoms.map((s) => `"${s}"`).join(',')}}`;
            }
            else if (typeof symptoms === 'string') {
                try {
                    const parsedSymptoms = JSON.parse(symptoms);
                    formattedSymptoms = `{${parsedSymptoms.map((s) => `"${s}"`).join(',')}}`;
                }
                catch (e) {
                    formattedSymptoms = `{"${symptoms}"}`;
                }
            }
            else {
                formattedSymptoms = '{}';
            }
            // Check if symptoms record exists
            const { data: existingSymptoms, error: symptomsCheckError } = yield db_config_1.supabase
                .from("consultation_symptoms")
                .select()
                .eq("consultation_id", consultationId)
                .single();
            if (symptomsCheckError && symptomsCheckError.code !== 'PGRST116') {
                throw symptomsCheckError;
            }
            // Update or insert symptoms based on existence
            const symptomsData = {
                consultation_id: consultationId,
                symptoms: formattedSymptoms,
                updated_at: new Date().toISOString(),
            };
            let symptomsUpdate;
            if (existingSymptoms) {
                symptomsUpdate = yield db_config_1.supabase
                    .from("consultation_symptoms")
                    .update(symptomsData)
                    .eq("consultation_id", consultationId);
            }
            else {
                symptomsUpdate = yield db_config_1.supabase
                    .from("consultation_symptoms")
                    .insert(Object.assign(Object.assign({}, symptomsData), { created_at: new Date().toISOString() }));
            }
            if (symptomsUpdate.error) {
                throw symptomsUpdate.error;
            }
            // Fetch the updated consultation with all related data
            const { data: updatedConsultation, error: fetchError } = yield db_config_1.supabase
                .from("consultation_notes")
                .select(`
          id,
          diagnosis,
          prescription,
          additional_notes,
          follow_up_date,
          updated_at,
          consultation_symptoms (
            symptoms
          )
        `)
                .eq("id", consultationId)
                .single();
            if (fetchError) {
                throw fetchError;
            }
            return res.status(200).json({
                message: "Consultation notes updated successfully",
                data: updatedConsultation,
            });
        }
        catch (error) {
            console.error("Error in updateConsultationNotes:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }),
    getConsultationNoteById: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { consultationId } = req.params;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const { data: consultation, error: consultationError } = yield db_config_1.supabase
                .from('consultation_notes')
                .select(`
        id,
        appointment_id,
        diagnosis,
        prescription,
        additional_notes,
        follow_up_date,
        created_at,
        updated_at,
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
          user:user_id!inner (
            id,
            first_name,
            last_name,
            profile_image
          ),
          doctor_profiles!inner (
            user_id
          )
        )
      `)
                .eq('id', consultationId)
                .single();
            if (consultationError || !consultation) {
                return res.status(404).json({ error: "Consultation not found" });
            }
            // Verify doctor owns the consultation
            if (((_c = (_b = consultation.appointments) === null || _b === void 0 ? void 0 : _b.doctor_profiles) === null || _c === void 0 ? void 0 : _c.user_id) !== userId) {
                return res
                    .status(403)
                    .json({ error: "Not authorized to view this consultation" });
            }
            const formattedConsultation = {
                id: consultation.id,
                patientId: ((_e = (_d = consultation.appointments) === null || _d === void 0 ? void 0 : _d.user) === null || _e === void 0 ? void 0 : _e.id) || '',
                patientName: `${(_g = (_f = consultation.appointments) === null || _f === void 0 ? void 0 : _f.user) === null || _g === void 0 ? void 0 : _g.first_name} ${(_j = (_h = consultation.appointments) === null || _h === void 0 ? void 0 : _h.user) === null || _j === void 0 ? void 0 : _j.last_name}`,
                dateTime: ((_k = consultation.appointments) === null || _k === void 0 ? void 0 : _k.date_time) || '',
                status: ((_l = consultation.appointments) === null || _l === void 0 ? void 0 : _l.status) || '',
                priority: ((_m = consultation.appointments) === null || _m === void 0 ? void 0 : _m.priority) || '',
                symptoms: ((_p = (_o = consultation.consultation_symptoms) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.symptoms) || "[]",
                diagnosis: consultation.diagnosis,
                prescription: consultation.prescription,
                additionalNotes: consultation.additional_notes,
                followUpDate: consultation.follow_up_date,
                lastUpdated: consultation.updated_at,
                patientImage: (_r = (_q = consultation.appointments) === null || _q === void 0 ? void 0 : _q.user) === null || _r === void 0 ? void 0 : _r.profile_image
            };
            return res.status(200).json({ data: formattedConsultation });
        }
        catch (error) {
            console.error("Error in getConsultationNoteById:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }),
};
exports.default = consultationNotesController;
