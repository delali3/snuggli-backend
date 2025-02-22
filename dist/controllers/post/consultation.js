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
const openai_1 = __importDefault(require("openai"));
const zod_1 = require("zod");
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
// Validation schemas
const messageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Message cannot be empty")
});
const systemPrompt = `You are a medical assistant. Your role is to:
1. Ask relevant questions about the patient's symptoms
2. Gather important medical information
3. Show empathy and professional courtesy
4. Keep responses clear and concise
5. Flag any urgent symptoms that require immediate attention

Do not provide specific medical diagnoses or treatment recommendations.
Instead, focus on understanding symptoms and determining urgency level.`;
// Start or continue chat
const chatConsultation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const sessionId = req.body.sessionId; // Add sessionId to request body
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }
        // Validate message
        const result = messageSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error.issues[0].message });
        }
        // Verify session belongs to user and is active
        const { data: session, error: sessionError } = yield db_config_1.supabase
            .from('consultation_sessions')
            .select('id')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();
        if (sessionError || !session) {
            return res.status(404).json({ error: 'Active session not found' });
        }
        // Get session messages
        const { data: history, error: historyError } = yield db_config_1.supabase
            .from('consultation_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(10);
        if (historyError) {
            throw historyError;
        }
        // Format messages for GPT
        const messages = [
            { role: 'system', content: systemPrompt },
            ...(history === null || history === void 0 ? void 0 : history.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.content
            }))) || [],
            { role: 'user', content: result.data.content }
        ];
        // Get GPT response
        const completion = yield openai.chat.completions.create({
            model: "gpt-4",
            messages: messages,
            temperature: 0.7,
            max_tokens: 500
        });
        const aiResponse = completion.choices[0].message.content;
        // Save messages to database
        const { error: saveError } = yield db_config_1.supabase
            .from('consultation_messages')
            .insert([
            {
                session_id: sessionId,
                user_id: userId,
                content: result.data.content,
                sender: 'user',
            },
            {
                session_id: sessionId,
                user_id: userId,
                content: aiResponse,
                sender: 'ai',
            }
        ]);
        if (saveError) {
            throw saveError;
        }
        // Update session last_update_time
        const { error: updateError } = yield db_config_1.supabase
            .from('consultation_sessions')
            .update({
            last_update_time: new Date().toISOString()
        })
            .eq('id', sessionId);
        if (updateError) {
            throw updateError;
        }
        return res.status(200).json({
            message: aiResponse
        });
    }
    catch (error) {
        console.error('Chat error:', error);
        return res.status(500).json({ error: "Failed to process message" });
    }
});
exports.default = chatConsultation;
