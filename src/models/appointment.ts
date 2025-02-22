interface Appointment {
    id?: string;
    name: string;
    description: string;
    date: string;
    time: string;
    status: string;
    doctor_id: string;
    patient_id: string;
    timestamp?: number;
}

export default Appointment;
