interface Otp {
    id?: number;
    code: string;
    user_id: number;
    expiration: Date;
    timestamp: number;
}

export default Otp;