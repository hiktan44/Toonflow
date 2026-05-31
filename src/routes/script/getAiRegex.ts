import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
 "/",
 validateFields({
 content: z.string(),
 }),
 async (req, res) => {
 const { content } = req.body;
 const systemPrompt = `youisa regex expert. The user will provide aScripttext, and you need to analyze the set within/chapterreturnJavaScriptregex


1. chaptermatch/chapterchaptermatchof/NamescriptName
2. returnformat is /regex/g/chapter\s*([0-9]+)\s*\s*([^\n\r]*)/g
3. returnregexnotOthermarkdown
4. if there's no obvious chapter separation pattern in the text,returnempty string`;

 const resText = await u.Ai.Text("universalAi").invoke({
 system: systemPrompt,
 messages: [
 {
 role: "user",
 content: content.slice(0, 2000),
 },
 ],
 });
 const result = (resText.text || "").trim();
 res.status(200).send(success(result));
 },
);
