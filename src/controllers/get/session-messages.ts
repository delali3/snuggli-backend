import { Request, Response } from 'express';
import { supabase } from "../../db/db_config";


interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email: string;
  };
}


// auth-service/src/controllers/get/session-messages.ts
const getSessionMessages = async (req: AuthRequest, res: any) => {
    try {
      const userId = req.user?.userId;
      const sessionId = req.params.sessionId;
  
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
  
      // Verify session belongs to user
      const { data: session, error: sessionError } = await supabase
        .from('consultation_sessions')
        .select('id')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();
  
      if (sessionError || !session) {
        return res.status(404).json({ error: 'Session not found' });
      }
  
      // Get messages
      const { data: messages, error: messagesError } = await supabase
        .from('consultation_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
  
      if (messagesError) {
        throw messagesError;
      }
  
      return res.status(200).json(messages);
    } catch (error) {
      console.error('Error fetching session messages:', error);
      return res.status(500).json({ error: 'Failed to fetch session messages' });
    }
  };
  

  export default getSessionMessages;