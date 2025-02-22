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
const getDoctors = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check database connection
        const { error: healthCheckError } = yield db_config_1.supabase.from("doctor_profiles").select("id").limit(1);
        if (healthCheckError) {
            console.error("Database connection error:", healthCheckError);
            return res.status(503).json({ error: "Database service unavailable" });
        }
        // Fetch approved doctors with type assertion
        const { data: doctors, error } = yield db_config_1.supabase
            .from("doctor_profiles")
            .select(`
        id,
        specialization,
        consultation_fee,
        availability,
        profile_image,
        verification_status,
        users!doctor_profiles_user_id_fkey (
          first_name,
          last_name,
          email,
          phone
        )
      `)
            .eq("verification_status", "approved")
            .returns();
        if (error) {
            console.error("Supabase query error:", error);
            return res.status(500).json({ error: "Failed to fetch doctor profiles" });
        }
        if (!doctors || doctors.length === 0) {
            return res.status(200).json([]);
        }
        // Format and filter doctors with proper typing
        const formattedDoctors = doctors
            .filter(doc => doc.users) // Ensure user data is present
            .map(doc => ({
            id: doc.id,
            name: `Dr. ${doc.users.first_name} ${doc.users.last_name}`,
            email: doc.users.email || null,
            phone: doc.users.phone || null,
            specialization: doc.specialization || null,
            consultationFee: doc.consultation_fee || null,
            availability: doc.availability || null,
            profileImage: doc.profile_image || null,
            verificationStatus: doc.verification_status,
        }));
        // Log filtered out doctors
        const filteredCount = doctors.length - formattedDoctors.length;
        if (filteredCount > 0) {
            console.warn(`Filtered out ${filteredCount} doctor(s) due to missing user data`);
        }
        return res.status(200).json(formattedDoctors);
    }
    catch (error) {
        console.error("Error in getDoctors controller:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: "An unexpected error occurred while fetching doctors",
        });
    }
});
exports.default = getDoctors;
