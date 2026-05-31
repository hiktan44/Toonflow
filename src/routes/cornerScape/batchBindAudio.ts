import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { tool, jsonSchema } from "ai";
const router = express.Router();

// Get asset
export default router.post(
 "/",
 validateFields({
 projectId: z.number(),
 assetsIds: z.array(z.number()),
 concurrentCount: z.number().min(1).optional(),
 }),
 async (req, res) => {
 const { projectId, assetsIds, concurrentCount } = req.body;
 const assetsData = await u.db("o_assets").whereIn("id", assetsIds).andWhere("projectId", projectId).select("id", "name", "describe", "type");

 const audioData = await u
 .db("o_assets")
 .where("type", "audio")
 .whereNull("assetsId")
 .andWhere("projectId", projectId)
 .select("id", "name", "describe");

 if (!audioData.length) return res.status(400).send(error("noSettingsaudioplease go toAssetupload audio"));

 const batchSize = concurrentCount ?? 1;

 async function processAsset(asset: (typeof assetsData)[number]) {
 try {
 const resultTool = tool({
 description: "matchCompletemust call this tool afterSubmitresult",
 inputSchema: jsonSchema<{ id: number; audioId: number }>(
 z
 .object({
 audioId: z.number().nullable().optional().describe("AssetmatchofaudioIDlistnomatchreturn"),
 })
 .toJSONSchema(),
 ),
 execute: async (result) => {
 await u.db("o_assetsRole2Audio").where("assetsRoleId", asset.id).delete();
 if (result?.audioId) await u.db("o_assetsRole2Audio").insert({ assetsRoleId: asset.id, assetsAudioId: result.audioId });
 await u.db("o_assets").where("id", asset.id).update("audioBindState", "Completed");
 return "noreply to user with any content";
 },
 });

 const audioList = audioData.map((i) => `- ID:${i.id} | Name:${i.name} | Description:${i.describe ?? "no"}`).join("\n");
 const promptData = await u.db("o_prompt").where("type", "audioBindPrompt").first();
 let audioBindPrompt = "" as string | undefined;
 if (promptData && promptData.useData) {
 audioBindPrompt = promptData.useData;
 } else {
 audioBindPrompt = promptData?.data ?? undefined;
 }
 const { text } = await u.Ai.Text("universalAi").invoke({
 messages: [
 {
 role: "system",
 content: `
 ${audioBindPrompt}
 `,
 },
 {
 role: "user",
 content: `
 ## audiolist
 ${audioList}
 ## matchAsset
 - ID:${asset.id} | Name:${asset.name} | Description:${asset.describe ?? "no"} | Type${asset.type}
 audiolistAssetCharactersettingsof resultTool Submitresult
 `,
 },
 ],
 tools: { resultTool },
 });
 } catch (e) {
 await u.db("o_assets").where("id", asset.id).update("audioBindState", "Generation failed");
 console.error(`[bindAudio] Asset ${asset.id} handleFailed:`, e);
 }
 }

 async function runWithConcurrency() {
 for (let i = 0; i < assetsData.length; i += batchSize) {
 const batch = assetsData.slice(i, i + batchSize);

 await Promise.all(batch.map((asset) => processAsset(asset)));
 }
 }
 await u
 .db("o_assets")
 .whereIn(
 "id",
 assetsData.map((i) => i.id),
 )
 .update("audioBindState", "Generating");
 runWithConcurrency();
 res.status(200).send(success());
 },
);
