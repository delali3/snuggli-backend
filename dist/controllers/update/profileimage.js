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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_config_1 = require("../../db/db_config");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// Configure multer for memory storage
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
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
const updateProfileImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Handle file upload using multer
        yield new Promise((resolve, reject) => {
            upload(req, res, (err) => {
                if (err instanceof multer_1.default.MulterError) {
                    reject(new Error(`Upload error: ${err.message}`));
                }
                else if (err) {
                    reject(err);
                }
                resolve();
            });
        });
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Generate unique filename
        const fileExt = path_1.default.extname(req.file.originalname);
        const fileName = `${userId}-${Date.now()}${fileExt}`;
        const filePath = `profile-images/${fileName}`;
        // Delete old profile image if exists
        const { data: user } = yield db_config_1.supabase
            .from('users')
            .select('profile_image')
            .eq('id', userId)
            .single();
        if (user === null || user === void 0 ? void 0 : user.profile_image) {
            const oldFilePath = user.profile_image.split('/').pop();
            if (oldFilePath) {
                yield db_config_1.supabase.storage
                    .from('avatars')
                    .remove([`profile-images/${oldFilePath}`]);
            }
        }
        // Upload new image to Supabase Storage
        const { data: uploadData, error: uploadError } = yield db_config_1.supabase.storage
            .from('avatars')
            .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true
        });
        if (uploadError) {
            throw uploadError;
        }
        // Get public URL for the uploaded image
        const { data: publicURL } = db_config_1.supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
        if (!publicURL) {
            throw new Error('Failed to get public URL for uploaded image');
        }
        // Update user profile with new image URL
        const { data: updatedUser, error: updateError } = yield db_config_1.supabase
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
    }
    catch (error) {
        console.error('Profile image update error:', error);
        // Handle specific errors
        if ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('Invalid file type')) {
            return res.status(400).json({ error: error.message });
        }
        if ((_c = error.message) === null || _c === void 0 ? void 0 : _c.includes('File too large')) {
            return res.status(400).json({ error: 'File size must be less than 5MB' });
        }
        return res.status(500).json({
            error: "Failed to update profile image. Please try again later."
        });
    }
});
exports.default = updateProfileImage;
