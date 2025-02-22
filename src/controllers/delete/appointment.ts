import { supabase } from "../../db/db_config";
import { z } from "zod";
import { Request, Response } from "express";

// Validation schema for appointment deletion
const deleteAppointmentSchema = z.object({
  id: z.string().regex(/^\d+$/, "Appointment ID must be a valid number"),
});

/**
 * Delete Appointment
 * @param req - Express Request object
 * @param res - Express Response object
 */
const deleteAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate the ID parameter
    const validation = deleteAppointmentSchema.safeParse(req.params);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message);
      res.status(400).json({ errors });
      return;
    }

    const { id } = validation.data;

    // Attempt to delete the appointment
    const { data, error, count } = await supabase
      .from("appointments")
      .delete({ count: "exact" }) // Request count of deleted rows
      .eq("id", id);

    if (error) {
      console.error("Error deleting appointment:", error.message);
      res
        .status(500)
        .json({ error: "An error occurred while deleting the appointment" });
      return;
    }

    // Check if any record was deleted
    if (count === 0) {
      res
        .status(404)
        .json({ error: "Appointment not found or already deleted" });
      return;
    }

    // Successful deletion
    res.status(200).json({message: "Appointment deleted successfully", id});
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "An unexpected error occurred. Please try again later." });
  }
};

export default deleteAppointment;
