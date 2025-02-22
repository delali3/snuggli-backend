// auth-service/src/controllers/put/updateProfile.ts
import { Request, Response } from 'express';
import { supabase } from "../../db/db_config";
import { z } from "zod";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email: string;
  };
}

// Validation schema for profile updates
const updateProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9+\- ]+$/, "Invalid phone number format"),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  address: z.string().optional(),
});

const updateProfile = async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;

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
    const { data: currentUser, error: fetchError } = await supabase
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
      const { data: existingPhone } = await supabase
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
    const { data: updatedUser, error: updateError } = await supabase
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

  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ 
      error: "Failed to update profile. Please try again later." 
    });
  }
};

export default updateProfile;