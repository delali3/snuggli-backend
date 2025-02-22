// import Timestamp from "@/models/timestamp";
// import UserTypes from "@/models/usertypes";
// import { Pool, PoolConnection } from "mysql2/promise";
// //@ts-ignore
// import { db_connection } from "@/shared/configs/db_config";

// const usertype = async (req: any, res: any) => {
//   let connection: PoolConnection | null = null;
//   try {
//     const conn_db: Pool | null = db_connection;
//     if (!conn_db) {
//       return res.status(400).json({ error: "Database connection failed" });
//     }
//     // get a connection from the pool
//     connection = await conn_db?.getConnection();
//     const userTypeData: UserTypes = req.body;
//     const timestamp: Timestamp = {
//       created_at: new Date(),
//       updated_at: new Date(),
//     };
//     await connection.beginTransaction();
//     // check if the user type exists
//     const [row]: any[] = await connection.query(
//       "SELECT * FROM user_types WHERE name = ?",
//       [userTypeData.name]
//     );
//     if (row.length > 0) {
//       await connection.rollback(); // Rollback transaction
//       return res.status(400).json({ error: "UserType already exists" });
//     }
//     // create a timestamp
//     const [timestampRow]: any[] = await connection.query(
//       "INSERT INTO timestamps SET ?",
//       [timestamp]
//     );

//     // create the user object
//     const usertype: UserTypes = {
//       name: userTypeData.name,
//       timestamp: timestampRow.insertId,
//     };

//     // check if the name is empty
//     if(!usertype.name) {
//       return res.status(400).json({ error: "Name is required" });
//     }

//     await connection.query("INSERT INTO user_types SET ?", [usertype]);

//     await connection.commit();
//     return res.status(200).json({ message: "UserType created successfully" });
//   } catch (error) {
//     if (connection) await connection.rollback(); // Rollback transaction
//     console.log(error);
//     return res.status(500).json({ error: "UserType not created" });
//   } finally {
//     if (connection) await connection.release();
//   }
// };

// export default usertype;
