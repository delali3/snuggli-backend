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
Object.defineProperty(exports, "__esModule", { value: true });
const db_config_1 = require("../../db/db_config");
const zod_1 = require("zod");
// Validation schema for appointment deletion
const deleteAppointmentSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^\d+$/, "Appointment ID must be a valid number"),
});
/**
 * Delete Appointment
 * @param req - Express Request object
 * @param res - Express Response object
 */
const deleteAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const { data, error, count } = yield db_config_1.supabase
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
        res.status(200).json({ message: "Appointment deleted successfully", id });
    }
    catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "An unexpected error occurred. Please try again later." });
    }
});
exports.default = deleteAppointment;
