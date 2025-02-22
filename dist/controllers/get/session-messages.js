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
// auth-service/src/controllers/get/session-messages.ts
const getSessionMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const sessionId = req.params.sessionId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Verify session belongs to user
        const { data: session, error: sessionError } = yield db_config_1.supabase
            .from('consultation_sessions')
            .select('id')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single();
        if (sessionError || !session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        // Get messages
        const { data: messages, error: messagesError } = yield db_config_1.supabase
            .from('consultation_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });
        if (messagesError) {
            throw messagesError;
        }
        return res.status(200).json(messages);
    }
    catch (error) {
        console.error('Error fetching session messages:', error);
        return res.status(500).json({ error: 'Failed to fetch session messages' });
    }
});
exports.default = getSessionMessages;
