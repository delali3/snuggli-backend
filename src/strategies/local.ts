import user_model from "../models/users_model";
import bcryptjs from "bcryptjs";
import { Pool } from "mysql2/promise";
import passport from "passport";
import { Strategy } from "passport-local";
// @ts-ignore
import { db_connection } from "../db/db_config";

export default passport.use(
  new Strategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (username, password, done) => {
      let connection: any;
      try {
        const conn_db: Pool | null = db_connection;
        connection = await conn_db?.getConnection();
        await connection.beginTransaction();
        const [users] = await connection.query(
          "SELECT * FROM users WHERE email = ?",
          [username]
        );
        if (users.length < 1) {
          return done(null, false, { message: "User not found" });
        }

        const user: user_model[] = users as user_model[];
        const validPassword = await bcryptjs.compare(
          password,
          user[0].password
        );
        if (!validPassword) {
          return done(null, false, { message: "Invalid password" });
        }
        return done(null, user[0].id);
      } catch (error) {
        return done(null, false);
      }
    }
  )
);

passport.serializeUser((user_id, done) => {
  done(null, user_id);
});

passport.deserializeUser((user_id: any, done) => {
  done(null, user_id);
});
