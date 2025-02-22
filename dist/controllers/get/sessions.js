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
const getSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { data: sessions, error } = yield db_config_1.supabase
            .from('consultation_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('start_time', { ascending: false });
        if (error) {
            throw error;
        }
        return res.status(200).json(sessions);
    }
    catch (error) {
        console.error('Error fetching sessions:', error);
        return res.status(500).json({ error: 'Failed to fetch consultation sessions' });
    }
});
exports.default = getSessions;
