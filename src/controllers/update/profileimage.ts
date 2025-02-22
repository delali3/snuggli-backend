// auth-service/src/controllers/put/updateProfileImage.ts
import { Request, Response } from 'express';
import { supabase } from "../../db/db_config";
import { z } from "zod";
import multer from 'multer';
import path from 'path';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email: string;
  };
  file?: Express.Multer.File;
}

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed'));
      return;
    }
    cb(null, true);
  },
}).single('profileImage');

const updateProfileImage = async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Handle file upload using multer
    await new Promise<void>((resolve, reject) => {
      upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          reject(new Error(`Upload error: ${err.message}`));
        } else if (err) {
          reject(err);
        }
        resolve();
      });
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${userId}-${Date.now()}${fileExt}`;
    const filePath = `profile-images/${fileName}`;

    // Delete old profile image if exists
    const { data: user } = await supabase
      .from('users')
      .select('profile_image')
      .eq('id', userId)
      .single();

    if (user?.profile_image) {
      const oldFilePath = user.profile_image.split('/').pop();
      if (oldFilePath) {
        await supabase.storage
          .from('avatars')
          .remove([`profile-images/${oldFilePath}`]);
      }
    }

    // Upload new image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL for the uploaded image
    const { data: publicURL } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!publicURL) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    // Update user profile with new image URL
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        profile_image: publicURL.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, profile_image')
      .single();

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      message: 'Profile image updated successfully',
      profileImage: updatedUser.profile_image
    });

  } catch (error: any) {
    console.error('Profile image update error:', error);
    
    // Handle specific errors
    if (error.message?.includes('Invalid file type')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message?.includes('File too large')) {
      return res.status(400).json({ error: 'File size must be less than 5MB' });
    }
    
    return res.status(500).json({ 
      error: "Failed to update profile image. Please try again later." 
    });
  }
};

export default updateProfileImage;