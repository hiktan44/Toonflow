import express from "express";
import u from "@/utils";
import { z } from "zod";
import sharp from "sharp";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { Output, tool } from "ai";
import { assetItemSchema } from "@/agents/productionAgent/tools";
const router = express.Router();
export type AssetData = z.infer<typeof assetItemSchema>;

export default router.post(
 "/",
 validateFields({
 storyboardIds: z.array(z.number()),
 projectId: z.number(),
 scriptId: z.number(),
 concurrentCount: z.number().min(1).optional(),
 compulsory: z.boolean().optional(),
 }),
 async (req, res) => {
 const {
 storyboardIds,
 projectId,
 scriptId,
 concurrentCount = 5,
 compulsory = false,
 }: {
 storyboardIds: number[];
 projectId: number;
 scriptId: number;
 concurrentCount: number;
 compulsory: boolean;
 } = req.body;
 if (!storyboardIds || storyboardIds.length === 0) return res.status(400).send(error("storyboardIdsCannot be empty"));
 // storyboardIds when AI generate newStoryboarddata
 let finalStoryboardIds: number[] = storyboardIds || [];
 // shouldGenerateImage === 0 ofStoryboardmarknot generatedmark remaining asGenerating
 const storyboardData = await u.db("o_storyboard").where("scriptId", scriptId).where("projectId", projectId).whereIn("id", finalStoryboardIds);
 if (!storyboardData.length) return res.status(500).send(error("not foundStoryboarddata"));
 const storyIds = storyboardData.map((i) => i.id);
 if (compulsory) {
 await u.db("o_storyboard").whereIn("id", storyIds).where("scriptId", scriptId).update({ state: "Generating", shouldGenerateImage: 1 });
 } else {
 await u.db("o_storyboard").whereIn("id", storyIds).where("scriptId", scriptId).where("shouldGenerateImage", 0).update({ state: "not generated" });
 await u.db("o_storyboard").whereIn("id", storyIds).where("scriptId", scriptId).where("shouldGenerateImage", 1).update({ state: "Generating" });
 }

 const projectSettingData = await u.db("o_project").where("id", projectId).select("imageModel", "imageQuality", "artStyle", "videoRatio").first();

 // by rowid storyboard relatedof assetId list
 const assets2StoryboardRows = await u
 .db("o_assets2Storyboard")
 .whereIn("storyboardId", storyIds)
 .orderBy("rowid")
 .select("storyboardId", "assetId");

 // collect all assetIdbatch query corresponding imageId
 const allAssetIds = [...new Set(assets2StoryboardRows.map((r: any) => r.assetId))];
 const assetImageMap: Record<number, number> = {};
 if (allAssetIds.length > 0) {
 const assetRows = await u.db("o_assets").whereIn("id", allAssetIds).select("id", "imageId");
 assetRows.forEach((row: any) => {
 assetImageMap[row.id] = row.imageId;
 });
 }

 // by rowid order rebuild assetRecordvalue is ordered imageId list
 const assetRecord: Record<number, number[]> = {};
 assets2StoryboardRows.forEach((item: any) => {
 if (!assetRecord[item.storyboardId]) {
 assetRecord[item.storyboardId] = [];
 }
 const imageId = assetImageMap[item.assetId];
 if (imageId != null) {
 assetRecord[item.storyboardId].push(imageId);
 }
 });
 const realStoryData = await u.db("o_storyboard").where("scriptId", scriptId).where("projectId", projectId).whereIn("id", storyIds);
 res.status(200).send(
 success(
 realStoryData.map((i) => ({
 id: i.id,
 prompt: i.prompt,
 associateAssetsIds: assetRecord[i.id!],
 src: null,
 state: i.state,
 videoDesc: i.videoDesc,
 shouldGenerateImage: i.shouldGenerateImage,
 })),
 ),
 );

 const generateTask = async (item: (typeof storyboardData)[number]) => {
 const repeloadObj = {
 prompt: item.prompt!,
 size: projectSettingData?.imageQuality as "1K" | "2K" | "4K",
 aspectRatio: projectSettingData?.videoRatio as `${number}:${number}`,
 };
 try {
 const imageCls = await u.Ai.Image(projectSettingData?.imageModel as `${string}:${string}`).run(
 {
 referenceList: await getAssetsImageBase64(assetRecord[item.id!] || []),
 ...repeloadObj,
 },
 {
 taskClass: "Generate storyboardimage",
 describe: "storyboard image",
 relatedObjects: JSON.stringify(repeloadObj),
 projectId: projectId,
 },
 );
 const savePath = `/${projectId}/assets/${scriptId}/${u.uuid()}.jpg`;
 await imageCls.save(savePath);
 await u.db("o_storyboard").where("id", item.id).update({
 filePath: savePath,
 state: "Completed",
 });
 } catch (e) {
 u.db("o_storyboard")
 .where("id", item.id)
 .update({
 filePath: "",
 reason: u.error(e).message,
 state: "Generation failed",
 });
 }
 };
 // by concurrentCount shouldGenerateImage === 0 ofStoryboard
 let generateList = [];
 if (compulsory) {
 generateList = storyboardData;
 } else {
 generateList = storyboardData.filter((item) => item.shouldGenerateImage !== 0);
 }
 for (let i = 0; i < generateList.length; i += concurrentCount) {
 const batch = generateList.slice(i, i + concurrentCount);
 await Promise.all(batch.map(generateTask));
 }
 },
);
async function getAssetsImageBase64(imageIds: number[]) {
 if (!imageIds.length) return [];

 const imagePaths = await u.db("o_image").whereIn("o_image.id", imageIds).select("o_image.id", "o_image.filePath");

 // id filePath mapping
 const id2Path = new Map<number, string>();
 for (const row of imagePaths) {
 id2Path.set(row.id, row.filePath);
 }

 // ensure output order matches imageIds consistent
 const imageUrls = await Promise.all(
 imageIds.map(async (id) => {
 const filePath = id2Path.get(id);
 if (filePath) {
 try {
 return await u.oss.getImageBase64(filePath);
 } catch {
 return null;
 }
 }
 return null;
 }),
 );
 // Invalid
 return (imageUrls.filter(Boolean) as string[]).map((url) => ({ type: "image" as const, base64: url }));
}
