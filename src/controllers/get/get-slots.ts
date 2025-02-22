// auth-service/src/controllers/get/get-slots.ts
import { Request, Response } from 'express';
import { supabase } from "../../db/db_config";

import dayjs from 'dayjs';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// Get available time slots
export const getAvailableSlots = async (req: Request, res: any) => {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;
  
      if (!doctorId || !date) {
        return res.status(400).json({ error: 'Doctor ID and date are required' });
      }
  
      // Get doctor's availability
      const { data: doctor, error: doctorError } = await supabase
        .from('doctor_profiles')
        .select('availability')
        .eq('id', doctorId)
        .single();
  
      if (doctorError || !doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }
  
      const requestedDate = dayjs(date as string);
      const dayOfWeek = requestedDate.day();
  
      // Get doctor's schedule for the requested day
      const daySchedule = doctor.availability.find(
        (schedule: any) => schedule.dayOfWeek === dayOfWeek
      );
  
      if (!daySchedule) {
        return res.status(200).json([]);
      }
  
      // Get existing appointments for the requested date
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('date_time')
        .eq('doctor_id', doctorId)
        .eq('status', 'upcoming')
        .gte('date_time', requestedDate.startOf('day').toISOString())
        .lte('date_time', requestedDate.endOf('day').toISOString());
  
      if (appointmentsError) throw appointmentsError;
  
      // Generate time slots
      const slots = [];
      const startTime = dayjs(`${date}T${daySchedule.startTime}`);
      const endTime = dayjs(`${date}T${daySchedule.endTime}`);
      const slotDuration = 30; // 30 minutes per slot
  
      let currentSlot = startTime;
      while (currentSlot.isBefore(endTime)) {
        const slotEnd = currentSlot.add(slotDuration, 'minute');
        const isBooked = existingAppointments?.some(
          app => dayjs(app.date_time).isSame(currentSlot)
        );
  
        slots.push({
          id: currentSlot.format('HH:mm'),
          startTime: currentSlot.format('HH:mm'),
          endTime: slotEnd.format('HH:mm'),
          isAvailable: !isBooked
        });
  
        currentSlot = slotEnd;
      }
  
      return res.status(200).json(slots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return res.status(500).json({ error: 'Failed to fetch available slots' });
    }
  };
  
export default getAvailableSlots;