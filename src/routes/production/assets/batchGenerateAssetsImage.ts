import express from "express";
import u from "@/utils";
import { z } from "zod";
import sharp from "sharp";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { Output } from "ai";
const router = express.Router();

export default router.post(
 "/",
 validateFields({
 assetIds: z.array(z.number()),
 projectId: z.number(),
 scriptId: z.number(),
 concurrentCount: z.number().min(1).optional(),
 }),
 async (req, res) => {
 const { assetIds, projectId, scriptId, concurrentCount = 5 } = req.body;

 const projectSettingData = await u.db("o_project").where("id", projectId).select("imageModel", "imageQuality", "artStyle").first();

 const assetsDataArr = await u.db("o_assets").whereIn("id", assetIds).select("id", "describe", "name", "type", "assetsId");
 const parentIds = assetsDataArr.map((item) => item.assetsId).filter((id) => id !== null);
 const parentAssetsData = await u
 .db("o_assets")
 .leftJoin("o_image", "o_assets.imageId", "o_image.id")
 .whereIn("o_assets.id", parentIds as number[])
 .select("o_assets.id", "o_image.filePath", "o_assets.describe");
 assetsDataArr.forEach((i: any) => {
 const parent = parentAssetsData.find((item) => item.id === i.assetsId);
 if (parent) {
 i.parentDescribe = parent.describe;
 }
 });
 const imageUrlRecord: Record<number, string> = {};
 parentAssetsData.forEach((item) => {
 if (item.filePath) imageUrlRecord[item.id] = item.filePath;
 });
 const rolePrompt = u.getArtPrompt(projectSettingData!.artStyle!, "art_skills", "art_character_derivative");
 const toolPrompt = u.getArtPrompt(projectSettingData!.artStyle!, "art_skills", "art_prop_derivative");
 const scenePrompt = u.getArtPrompt(projectSettingData!.artStyle!, "art_skills", "art_scene_derivative");
 const promptRecord: Record<string, { prompt: string }> = {
 role: {
 prompt: rolePrompt,
 },
 tool: {
 prompt: toolPrompt,
 },
 scene: {
 prompt: scenePrompt,
 },
 };
 // first batch create for all assets create image records and mark as"Generating"
 const imageIdMap: Record<number, number> = {};
 for (const item of assetsDataArr) {
 const [imageId] = await u.db("o_image").insert({
 assetsId: item.id,
 type: item.type,
 state: "Generating",
 resolution: projectSettingData?.imageQuality,
 model: projectSettingData?.imageModel,
 });
 imageIdMap[item.id!] = imageId;
 await u.db("o_assets").where("id", item.id).update({ imageId: imageId });
 }

 const imageData: { id: number; state: string; src: string }[] = [];
 res.status(200).send(success("openstartGenerate asset image"));
 const generateSingleAsset = async (item: any) => {
 const imageId = imageIdMap[item.id!];
 const typeConfig = promptRecord[item.type!] || promptRecord["role"];

 const { text } = await u.Ai.Text("universalAi").invoke({
 system: `${typeConfig.prompt}`,
 messages: [
 {
 role: "user",
 content: `
 parentasset description: ${item.parentDescribe || "noDescription"}
 currentasset description: ${item.describe || "noDescription"}`,
 },
 ],
 });
 await u.db("o_assets").where("id", item.id).update({ prompt: text });

 const imageBase64 = imageUrlRecord[item.assetsId!] ? await u.oss.getImageBase64(imageUrlRecord[item.assetsId!]) : null;
 try {
 const repeloadObj = {
 prompt: text,
 size: projectSettingData?.imageQuality as "1K" | "2K" | "4K",
 aspectRatio: "16:9" as `${number}:${number}`,
 };
 const imageCls = await u.Ai.Image(projectSettingData?.imageModel as `${string}:${string}`).run(
 {
 referenceList: imageBase64 ? [{ type: "image", base64: imageBase64 }] : [],
 ...repeloadObj,
 },
 {
 taskClass: "image",
 describe: "Assetimage",
 relatedObjects: JSON.stringify(repeloadObj),
 projectId: projectId,
 },
 );
 const savePath = `/${projectId}/assets/${scriptId}/${item.type}/${u.uuid()}.jpg`;
 await imageCls.save(savePath);
 await u.db("o_image").where({ id: imageId }).update({ state: "Completed", filePath: savePath });
 return {
 id: item.id!,
 state: "Completed",
 src: await u.oss.getSmallImageUrl(savePath),
 };
 } catch (e) {
 await u
 .db("o_image")
 .where({ id: imageId })
 .update({ state: "Generation failed", errorReason: u.error(e).message });
 return {
 id: item.id!,
 state: "Generation failed",
 src: "",
 };
 }
 };

 // by concurrentCount batch concurrent execution
 for (let i = 0; i < assetsDataArr.length; i += concurrentCount) {
 const batch = assetsDataArr.slice(i, i + concurrentCount);
 const batchResults = await Promise.all(batch.map(generateSingleAsset));
 imageData.push(...batchResults);
 }
 },
);
