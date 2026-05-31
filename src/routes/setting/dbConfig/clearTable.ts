import express from "express";
import { success, error } from "@/lib/responseFormat";
import { db } from "@/utils/db";

const router = express.Router();

export default router.post("/", async (req, res) => {
 try {
 const { tableName } = req.body;
 if (!tableName || typeof tableName !== "string") {
 return res.status(400).send(error("please provideValidoftable"));
 }

 // verify table name exists (prevent SQL injection)
 const tableExists: { name: string }[] = await db.raw(
 `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
 [tableName],
 );
 if (tableExists.length === 0) {
 return res.status(400).send(error("Table not found"));
 }

 await db.raw(`DELETE FROM "${tableName}"`);

 res.status(200).send(success(`table ${tableName} cleared`));
 } catch (err: any) {
 res.status(500).send(error(err?.message || "Table clear failed"));
 }
});
