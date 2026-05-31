import express from "express";
import { error, success } from "@/lib/responseFormat";
import u from "@/utils";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";
import fs from "fs/promises";
import path from "path";

const router = express.Router();

export default router.post(
 "/",
 validateFields({
 path: z.string(),
 }),
 async (req, res) => {
 const { path: filePath } = req.body;

 const modelPromptRoot = u.getPath(["modelPrompt"]);

 // Pathtraversal detection
 const resolvedRoot = path.resolve(modelPromptRoot);
 const resolvedFile = path.resolve(modelPromptRoot, filePath);
 if (!resolvedFile.startsWith(resolvedRoot + path.sep)) {
 return res.status(400).send(error("Invalid path"));
 }

 // File not foundthen throw error
 try {
 await fs.access(resolvedFile);
 } catch {
 return res.status(404).send(error("File not found"));
 }

 await fs.unlink(resolvedFile);
 res.status(200).send(success("Deleted successfully"));
 },
);
