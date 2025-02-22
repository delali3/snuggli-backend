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
// Validation schema for profile updates
const updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, "First name must be at least 2 characters"),
    lastName: zod_1.z.string().min(2, "Last name must be at least 2 characters"),
    phone: zod_1.z.string().regex(/^[0-9+\- ]+$/, "Invalid phone number format"),
    gender: zod_1.z.enum(["male", "female", "other"]),
    dateOfBirth: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    address: zod_1.z.string().optional(),
});
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Validate request body
        const result = updateProfileSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: result.error.issues[0].message
            });
        }
        // Get current user data for comparison
        const { data: currentUser, error: fetchError } = yield db_config_1.supabase
            .from('users')
            .select('email, phone')
            .eq('id', userId)
            .single();
        if (fetchError) {
            console.error('Error fetching user:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch user data' });
        }
        // Check if phone number is being changed and if it's already in use
        if (result.data.phone !== currentUser.phone) {
            const { data: existingPhone } = yield db_config_1.supabase
                .from('users')
                .select('id')
                .eq('phone', result.data.phone)
                .neq('id', userId)
                .single();
            if (existingPhone) {
                return res.status(400).json({
                    error: "This phone number is already in use"
                });
            }
        }
        // Update user data
        const { data: updatedUser, error: updateError } = yield db_config_1.supabase
            .from('users')
            .update({
            first_name: result.data.firstName,
            last_name: result.data.lastName,
            phone: result.data.phone,
            gender: result.data.gender,
            date_of_birth: result.data.dateOfBirth,
            address: result.data.address,
            updated_at: new Date().toISOString()
        })
            .eq('id', userId)
            .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        gender,
        date_of_birth,
        address,
        role,
        status,
        created_at,
        updated_at
      `)
            .single();
        if (updateError) {
            console.error('Error updating user:', updateError);
            return res.status(500).json({ error: 'Failed to update profile' });
        }
        // Return updated user data
        return res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name,
                phone: updatedUser.phone,
                gender: updatedUser.gender,
                dateOfBirth: updatedUser.date_of_birth,
                address: updatedUser.address,
                role: updatedUser.role,
                status: updatedUser.status,
                createdAt: updatedUser.created_at,
                updatedAt: updatedUser.updated_at
            }
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({
            error: "Failed to update profile. Please try again later."
        });
    }
});
exports.default = updateProfile;
