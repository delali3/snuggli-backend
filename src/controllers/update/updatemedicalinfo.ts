// auth-service/src/controllers/put/updateMedicalInfo.ts
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

// Validation schema for medications
const medicationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// Schema for the update request
const updateMedicalInfoSchema = z.object({
  allergies: z.array(z.string()).optional(),
  currentMedications: z.array(medicationSchema).optional()
});

const updateMedicalInfo = async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;

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
    const updateFields: any = {};

    if (updateData.allergies !== undefined) {
      updateFields.allergies = updateData.allergies;
    }

    if (updateData.currentMedications !== undefined) {
      updateFields.current_medications = updateData.currentMedications;
    }

    // Update the patient profile
    const { data: updatedProfile, error: updateError } = await supabase
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

  } catch (error) {
    console.error('Update medical info error:', error);
    return res.status(500).json({ 
      error: "Failed to update medical information. Please try again later." 
    });
  }
};

export default updateMedicalInfo;