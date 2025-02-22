// auth-service/src/controllers/post/completesession.ts
import { Request, Response } from 'express';
import { supabase } from "../../db/db_config";
import OpenAI from 'openai';
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface ConsultationSummary {
  content: {
    content: string;
    timestamp: string;
  };
  session_id: string;
}

interface ConsultationSession {
  id: string;
  user_id: string;
  status: 'active' | 'completed';
  updated_at: string;
}

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

export const completeSession = async (req: AuthRequest, res: any) => {
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

    // Verify session exists and belongs to user
    const { data: session, error: sessionError } = await supabase
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
    const { error: updateError } = await supabase
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
    const { data: summary, error: summaryError } = await supabase
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

  } catch (error) {
    console.error('Session completion error:', error);
    return res.status(500).json({ 
      error: "Failed to complete consultation session",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};