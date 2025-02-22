// auth-service/src/controllers/post/consultation.ts
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

// Validation schemas
const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty")
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
  const chatConsultation = async (req: AuthRequest, res: any) => {
    try {
      const userId = req.user?.userId;
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
      const { data: session, error: sessionError } = await supabase
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
      const { data: history, error: historyError } = await supabase
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
        ...history?.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        })) || [],
        { role: 'user', content: result.data.content }
      ];
  
      // Get GPT response
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 500
      });
  
      const aiResponse = completion.choices[0].message.content;
  
      // Save messages to database
      const { error: saveError } = await supabase
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
      const { error: updateError } = await supabase
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
  
    } catch (error) {
      console.error('Chat error:', error);
      return res.status(500).json({ error: "Failed to process message" });
    }
  };
  
  export default chatConsultation;