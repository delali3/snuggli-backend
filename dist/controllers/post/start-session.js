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
// auth-service/src/controllers/post/start-session.ts
const startSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Complete any active sessions
        const { error: updateError } = yield db_config_1.supabase
            .from('consultation_sessions')
            .update({ status: 'completed' })
            .eq('user_id', userId)
            .eq('status', 'active');
        if (updateError) {
            throw updateError;
        }
        // Create new session
        const { data: session, error: createError } = yield db_config_1.supabase
            .from('consultation_sessions')
            .insert({
            user_id: userId,
            status: 'active'
        })
            .select()
            .single();
        if (createError) {
            throw createError;
        }
        // Create initial AI greeting message
        const { error: messageError } = yield db_config_1.supabase
            .from('consultation_messages')
            .insert({
            session_id: session.id,
            user_id: userId,
            content: "Hello! I'm your medical assistant. Please describe your symptoms and concerns in detail.",
            sender: 'ai'
        });
        if (messageError) {
            throw messageError;
        }
        return res.status(201).json({ sessionId: session.id });
    }
    catch (error) {
        console.error('Error starting session:', error);
        return res.status(500).json({ error: 'Failed to start consultation session' });
    }
});
exports.default = startSession;
