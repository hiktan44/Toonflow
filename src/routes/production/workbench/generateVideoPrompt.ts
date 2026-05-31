import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import fs from "fs/promises";
import path from "path";
const router = express.Router();

export default router.post(
 "/",
 validateFields({
 trackId: z.number(),
 projectId: z.number(),
 info: z.array(
 z.object({
 id: z.number(),
 sources: z.string(),
 }),
 ),
 model: z.string(),
 mode: z.string(),
 }),
 async (req, res) => {
 const { trackId, projectId, info, model, mode } = req.body;

 //Query
 const images = await Promise.all(
 info.map(async (item: { id: number; sources: string }) => {
 if (item.sources === "storyboard") {
 // QueryStoryboardInformation
 const storyboard = await u
 .db("o_storyboard")
 .where("o_storyboard.id", item.id)
 .select("videoDesc", "prompt", "track", "duration", "shouldGenerateImage")
 .first();
 // QueryStoryboardrelatedofAssetID
 const assetRows = await u.db("o_assets2Storyboard").where("storyboardId", item.id).orderBy("rowid").select("assetId");
 const associateAssetsIds = assetRows.map((row: any) => row.assetId);
 return {
 ...storyboard,
 associateAssetsIds,
 _type: "storyboard", // markType
 };
 }
 if (item.sources === "assets") {
 // Querymaterial
 const assetsData = await u
 .db("o_assets")
 .leftJoin("o_image", "o_image.id", "o_assets.imageId")
 .where("o_assets.id", item.id)
 .select("o_assets.id", "o_assets.type", "o_assets.name", "o_image.filePath")
 .first();
 return {
 ...assetsData,
 _type: "assets", // markType
 };
 }
 }),
 );

 // split assets and storyboard
 const assets: any[] = [];
 const storyboard: any[] = [];
 for (const item of images) {
 if (!item) continue; // ignore empty
 if (item._type === "assets")
 assets.push({
 id: item.id,
 type: item.type,
 name: item.name,
 filePath: item.filePath,
 });
 if (item._type === "storyboard")
 storyboard.push({
 videoDesc: item.videoDesc,
 prompt: item.prompt,
 track: item.track,
 duration: item.duration,
 associateAssetsIds: item.associateAssetsIds,
 shouldGenerateImage: item.shouldGenerateImage,
 });
 }
 const assetsNotAudioIds = assets.filter((i) => i.type == "audio").map((i) => i.id);

 const assets2Audio = await u
 .db("o_assets")
 .whereIn("o_assets.id", assetsNotAudioIds)
 .join("o_assetsRole2Audio", "o_assetsRole2Audio.assetsAudioId", "o_assets.assetsId")
 .select("o_assets.assetsId", "o_assets.id", "o_assetsRole2Audio.assetsAudioId", "o_assetsRole2Audio.assetsRoleId");

 const assetsAudioRecord: Record<number, number> = {};
 assets2Audio.forEach((i) => {
 assetsAudioRecord[i.assetsRoleId!] = i.id!;
 });

 const [id, modelData] = model.split(/:(.+)/);
 const projectData = await u.db("o_project").select("*").where({ id: projectId }).first();
 const videoPrompt = await u.db("o_prompt").where("type", "videoPromptGeneration").first();
 let videoPromptGeneration = "" as string | undefined;

 const modelPromptData = await u.db("o_modelPrompt").where("vendorId", id).where("model", modelData).first();
 //Query Video prompt
 if (modelPromptData) {
 const modelPromptRoot = u.getPath(["modelPrompt"]);
 try {
 const fullPath = path.join(modelPromptRoot, modelPromptData?.path!);
 const content = await fs.readFile(fullPath, "utf-8");
 videoPromptGeneration = content ?? "";
 } catch {}
 }

 // Querybased onModel name + mode match modelPrompt/video/ underoffile
 if (!videoPromptGeneration) {
 const modelPromptRoot = u.getPath(["modelPrompt"]);
 const videoPromptDir = path.join(modelPromptRoot, "video");
 const modelLower = (modelData ?? "").toLowerCase();

 let fileName: string | null = null;

 if (modelLower.includes("wan") && modelLower.includes("2.6")) {
 // wan2.6 series => Single imageFirst and last frames
 fileName = "wan2.6Single-imageFirstFrameMode.md";
 } else if (/seedance.*2[.\-]0/i.test(modelData)) {
 // seedance 2.0 / 2-0 series
 fileName = "seedance2Multi-parameterMode.md";
 } else if (mode === "startEndRequired" || mode === "endFrameOptional" || mode === "startFrameOptional") {
 // body.mode First and last framesrelated => First and last frames
 fileName = "universalFirstAndLastFrameMode.md";
 } else if (typeof mode === "string" && mode.startsWith('["') && mode.endsWith('"]')) {
 // Other => Multi-reference
 fileName = "universalMulti-parameterMode.md";
 }
 if (fileName) {
 try {
 const fullPath = path.join(videoPromptDir, fileName);
 videoPromptGeneration = await fs.readFile(fullPath, "utf-8");
 } catch {
 // File not foundalternative
 }
 }
 }

 //alternative
 if (!videoPromptGeneration) {
 if (videoPrompt && videoPrompt.useData) {
 videoPromptGeneration = videoPrompt.useData;
 } else {
 videoPromptGeneration = videoPrompt?.data ?? undefined;
 }
 }

 const artStyle = projectData?.artStyle || "no";
 console.log("%c Line:158 🍢", "background:#ffdd4d",assets);

 const visualManual = u.getArtPrompt(artStyle, "art_skills", "art_storyboard_video");
 const content = `
 **Model name**${modelData},

 **AssetInformation**CharacterScenePropaudio):${assets
 .filter((i) => i.filePath)
 .map((i) => `[${i.id},${i.type},${i.name} ${assetsAudioRecord[i.id] ? `audio:${assetsAudioRecord[i.id]}` : ""} ] `)
 .join("")},
 **StoryboardInformation**${storyboard.map(
 (i) => `<storyboardItem
 videoDesc='${i.videoDesc}'
 duration='${i.duration}'
></storyboardItem>`,
 )},
 `;
 console.log("%c Line:156 🍬 content", "background:#4fff4B", content);

 try {
 const { text } = await u.Ai.Text("universalAi").invoke({
 system: videoPromptGeneration,
 messages: [
 {
 role: "assistant",
 content: `${visualManual}`,
 },
 {
 role: "user",
 content: content,
 },
 ],
 });
 await u.db("o_videoTrack").where({ id: trackId }).update({
 prompt: text,
 });
 res.status(200).send(success(text));
 } catch (e) {
 res.status(400).send(error(u.error(e).message));
 }
 },
);
