// auth-service/src/controllers/consultation.controller.ts
import { Request, Response } from 'express';
import { supabase } from "../../db/db_config";
import OpenAI from 'openai';
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email: string;
  };
}

// Validation schema for session ID
const sessionSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format")
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

export const getSessionSummary = async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.userId;
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
    const { data: session, error: sessionError } = await supabase
      .from('consultation_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get session messages
    const { data: messages, error: messagesError } = await supabase
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
    const completion = await openai.chat.completions.create({
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
    const { data: doctors, error: doctorsError } = await supabase
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
    const { error: summaryError } = await supabase
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

  } catch (error) {
    console.error('Summary generation error:', error);
    return res.status(500).json({ 
      error: "Failed to generate consultation summary" 
    });
  }
};

export default getSessionSummary;