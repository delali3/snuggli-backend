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
exports.completeSession = void 0;
const db_config_1 = require("../../db/db_config");
const openai_1 = __importDefault(require("openai"));
const zod_1 = require("zod");
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
// Validation schema for session ID
const sessionSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid("Invalid session ID format")
});
// GPT prompt for analysis
const summaryPrompt = `Please analyze this medical consultation and provide a structured response containing:
1. Main symptoms (as an array)
2. Severity level (low/moderate/high)
3. Recommended specialist type
4. Urgency level (low/medium/high)
5. Key recommendations (as an array)

Format the response in a clear, structured way.

Consultation transcript:`;
const completeSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { sessionId } = req.params;
        // Validate session ID
        const result = sessionSchema.safeParse({ sessionId });
        if (!result.success) {
            return res.status(400).json({ error: result.error.issues[0].message });
        }
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Verify session exists and belongs to user
        const { data: session, error: sessionError } = yield db_config_1.supabase
            .from('consultation_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single();
        if (sessionError || !session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        if (session.status === 'completed') {
            return res.status(400).json({ error: 'Session already completed' });
        }
        // Update session status
        const { error: updateError } = yield db_config_1.supabase
            .from('consultation_sessions')
            .update({
            status: 'completed',
            updated_at: new Date().toISOString()
        })
            .eq('id', sessionId)
            .eq('user_id', userId);
        if (updateError) {
            throw updateError;
        }
        // Get session summary with proper error handling
        const { data: summary, error: summaryError } = yield db_config_1.supabase
            .from('consultation_summaries')
            .select('*')
            .eq('session_id', sessionId)
            .single();
        if (summaryError) {
            console.error('Error fetching summary:', summaryError);
            return res.status(500).json({
                error: "Failed to fetch consultation summary"
            });
        }
        // Return structured response
        return res.status(200).json({
            message: 'Session completed successfully',
            sessionId,
            summary: summary ? {
                content: summary.content,
                timestamp: summary.timestamp
            } : null
        });
    }
    catch (error) {
        console.error('Session completion error:', error);
        return res.status(500).json({
            error: "Failed to complete consultation session",
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.completeSession = completeSession;
