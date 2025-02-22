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
const zod_1 = require("zod");
// Validation schema for medications
const medicationSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1, "Medication name is required"),
    dosage: zod_1.z.string().min(1, "Dosage is required"),
    frequency: zod_1.z.string().min(1, "Frequency is required"),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional()
});
// Schema for the update request
const updateMedicalInfoSchema = zod_1.z.object({
    allergies: zod_1.z.array(zod_1.z.string()).optional(),
    currentMedications: zod_1.z.array(medicationSchema).optional()
});
const updateMedicalInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Validate request body
        const result = updateMedicalInfoSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: result.error.issues[0].message
            });
        }
        const updateData = result.data;
        const updateFields = {};
        if (updateData.allergies !== undefined) {
            updateFields.allergies = updateData.allergies;
        }
        if (updateData.currentMedications !== undefined) {
            updateFields.current_medications = updateData.currentMedications;
        }
        // Update the patient profile
        const { data: updatedProfile, error: updateError } = yield db_config_1.supabase
            .from('patient_profiles')
            .update(updateFields)
            .eq('user_id', userId)
            .select('*')
            .single();
        if (updateError) {
            console.error('Error updating medical info:', updateError);
            return res.status(500).json({ error: 'Failed to update medical information' });
        }
        return res.status(200).json({
            profile: {
                id: updatedProfile.id,
                allergies: updatedProfile.allergies || [],
                currentMedications: updatedProfile.current_medications || []
            }
        });
    }
    catch (error) {
        console.error('Update medical info error:', error);
        return res.status(500).json({
            error: "Failed to update medical information. Please try again later."
        });
    }
});
exports.default = updateMedicalInfo;
