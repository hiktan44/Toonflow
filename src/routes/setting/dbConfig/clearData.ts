import express from "express";
import { success, error } from "@/lib/responseFormat";
import { db } from "@/utils/db";
import initDB from "@/lib/initDB";

const router = express.Router();

export default router.get("/", async (req, res) => {
 try {
 // get all table names
 const tables: { name: string }[] = await db.raw(
 `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%'`,
 );

 // Disableforeign key constraints, one by oneDeletealltable
 await db.raw("PRAGMA foreign_keys = OFF");
 for (const table of tables) {
 await db.schema.dropTableIfExists(table.name);
 }
 await db.raw("PRAGMA foreign_keys = ON");

 // re-Initializing database
 await initDB(db as any);

 res.status(200).send(success("Database cleared and re-initialized"));
 } catch (err: any) {
 res.status(500).send(error(err?.message || "Clear failed"));
 }
});
