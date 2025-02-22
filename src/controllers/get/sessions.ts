import { Request, Response } from 'express';
import { supabase } from "../../db/db_config";

// auth-service/src/controllers/get/sessions.ts
  
  interface AuthRequest extends Request {
    user?: {
      userId: string;
      role: string;
      email: string;
    };
  }
  
  const getSessions = async (req: AuthRequest, res: any) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
  
      const { data: sessions, error } = await supabase
        .from('consultation_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });
  
      if (error) {
        throw error;
      }
  
      return res.status(200).json(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return res.status(500).json({ error: 'Failed to fetch consultation sessions' });
    }
  };

  export default getSessions;