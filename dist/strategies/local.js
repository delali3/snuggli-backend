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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
// @ts-ignore
const db_config_1 = require("../db/db_config");
exports.default = passport_1.default.use(new passport_local_1.Strategy({
    usernameField: "email",
    passwordField: "password",
}, (username, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    let connection;
    try {
        const conn_db = db_config_1.db_connection;
        connection = yield (conn_db === null || conn_db === void 0 ? void 0 : conn_db.getConnection());
        yield connection.beginTransaction();
        const [users] = yield connection.query("SELECT * FROM users WHERE email = ?", [username]);
        if (users.length < 1) {
            return done(null, false, { message: "User not found" });
        }
        const user = users;
        const validPassword = yield bcryptjs_1.default.compare(password, user[0].password);
        if (!validPassword) {
            return done(null, false, { message: "Invalid password" });
        }
        return done(null, user[0].id);
    }
    catch (error) {
        return done(null, false);
    }
})));
passport_1.default.serializeUser((user_id, done) => {
    done(null, user_id);
});
passport_1.default.deserializeUser((user_id, done) => {
    done(null, user_id);
});
