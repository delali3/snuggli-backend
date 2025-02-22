import { Request, Response } from 'express';
import { supabase } from "../../db/db_config";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email: string;
  };
}

  // auth-service/src/controllers/post/start-session.ts
  const startSession = async (req: AuthRequest, res: any) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
  
      // Complete any active sessions
      const { error: updateError } = await supabase
        .from('consultation_sessions')
        .update({ status: 'completed' })
        .eq('user_id', userId)
        .eq('status', 'active');
  
      if (updateError) {
        throw updateError;
      }
  
      // Create new session
      const { data: session, error: createError } = await supabase
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
      const { error: messageError } = await supabase
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
    } catch (error) {
      console.error('Error starting session:', error);
      return res.status(500).json({ error: 'Failed to start consultation session' });
    }
  };
  
  export default startSession;