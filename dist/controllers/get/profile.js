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
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Get user data
        const { data: user, error: userError } = yield db_config_1.supabase
            .from('users')
            .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        gender,
        date_of_birth,
        role,
        status,
        created_at,
        updated_at
      `)
            .eq('id', userId)
            .single();
        if (userError || !user) {
            console.error('Error fetching user:', userError);
            return res.status(404).json({ error: 'User not found' });
        }
        // Get role-specific profile data
        let profileData = null;
        if (userRole === 'doctor') {
            const { data: doctorProfile, error: doctorError } = yield db_config_1.supabase
                .from('doctor_profiles')
                .select(`
          id,
          specialization,
          license_number,
          verification_status,
          created_at,
          updated_at
        `)
                .eq('user_id', userId)
                .single();
            if (doctorError) {
                console.error('Error fetching doctor profile:', doctorError);
                return res.status(500).json({ error: 'Error fetching doctor profile' });
            }
            profileData = doctorProfile;
        }
        else {
            const { data: patientProfile, error: patientError } = yield db_config_1.supabase
                .from('patient_profiles')
                .select(`
          id,
          allergies,
          medical_history,
          current_medications,
          created_at,
          updated_at
        `)
                .eq('user_id', userId)
                .single();
            if (patientError) {
                console.error('Error fetching patient profile:', patientError);
                return res.status(500).json({ error: 'Error fetching patient profile' });
            }
            profileData = patientProfile;
        }
        // Return combined user and profile data
        return res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                gender: user.gender,
                dateOfBirth: user.date_of_birth,
                role: user.role,
                status: user.status,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            },
            profile: profileData
        });
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        return res.status(500).json({
            error: "Failed to fetch profile data. Please try again later."
        });
    }
});
exports.default = getProfile;
