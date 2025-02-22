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
exports.getSessionSummary = void 0;
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
const getSessionSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // Verify session belongs to user
        const { data: session, error: sessionError } = yield db_config_1.supabase
            .from('consultation_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single();
        if (sessionError || !session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        // Get session messages
        const { data: messages, error: messagesError } = yield db_config_1.supabase
            .from('consultation_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });
        if (messagesError) {
            throw messagesError;
        }
        if (!messages.length) {
            return res.status(400).json({ error: 'No messages found in session' });
        }
        // Format conversation for GPT
        const conversationText = messages
            .map(msg => `${msg.sender.toUpperCase()}: ${msg.content}`)
            .join('\n');
        // Get GPT analysis
        const completion = yield openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: 'user',
                    content: `${summaryPrompt}\n\n${conversationText}`
                }
            ],
            temperature: 0.3,
            max_tokens: 500
        });
        const analysis = completion.choices[0].message.content;
        // Find matching doctors based on analysis
        const { data: doctors, error: doctorsError } = yield db_config_1.supabase
            .from('doctor_profiles')
            .select(`
        *,
        users!inner(
          id,
          first_name,
          last_name,
          email
        )
      `)
            .eq('verification_status', 'approved')
            .limit(5);
        if (doctorsError) {
            throw doctorsError;
        }
        // Save summary
        const { error: summaryError } = yield db_config_1.supabase
            .from('consultation_summaries')
            .insert({
            session_id: sessionId,
            user_id: userId,
            content: analysis,
            created_at: new Date().toISOString()
        });
        if (summaryError) {
            throw summaryError;
        }
        // Format and send response
        return res.status(200).json({
            summary: {
                content: analysis,
                timestamp: new Date().toISOString()
            },
            doctors: doctors.map(doc => ({
                id: doc.id,
                name: `Dr. ${doc.users.first_name} ${doc.users.last_name}`,
                specialization: doc.specialization,
                experience: doc.experience,
                rating: doc.rating,
                consultationFee: doc.consultation_fee,
                availability: doc.availability
            }))
        });
    }
    catch (error) {
        console.error('Summary generation error:', error);
        return res.status(500).json({
            error: "Failed to generate consultation summary"
        });
    }
});
exports.getSessionSummary = getSessionSummary;
exports.default = exports.getSessionSummary;
