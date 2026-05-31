import express from "express";
import u from "@/utils";
import pLimit from "p-limit";
import * as zod from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();
interface OutlineItem {
 description: string;
 name: string;
}

interface OutlineData {
 chapterRange: number[];
 characters?: OutlineItem[];
 props?: OutlineItem[];
 scenes?: OutlineItem[];
}

interface NovelChapter {
 id: number;
 reel: string;
 chapter: string;
 chapterData: string;
 projectId: number;
}

type ItemType = "characters" | "props" | "scenes";

//Polish prompt
export default router.post(
 "/",
 validateFields({
 items: zod.array(
 zod.object({
 assetsId: zod.number(),
 type: zod.string(),
 name: zod.string(),
 describe: zod.string(),
 }),
 ),
 projectId: zod.number(),
 concurrentCount: zod.number().int().min(1).optional(),
 otherTextPrompt: zod.string(),
 }),
 async (req, res) => {
 const { projectId, items, concurrentCount, otherTextPrompt } = req.body;
 //get style
 const project = await u.db("o_project").where("id", projectId).select("artStyle", "type", "intro").first();
 //if corresponding not foundProjectreturnError
 if (!project) return res.status(500).send(success({ message: "Project" }));

 // preload common data
 const assetsIds = items.map((item: { assetsId: number }) => item.assetsId);
 //QueryallAssetused to determine eachAssetis or is notderivedAsset
 const assetsDataList = await u.db("o_assets").whereIn("id", assetsIds).select("id", "assetsId");
 if (!assetsDataList || assetsDataList.length === 0) return res.status(500).send(error("Asset not found"));
 const assetsDataMap = new Map(assetsDataList.map((a: any) => [a.id, a]));
 // allStatusGenerating
 await u.db("o_assets").whereIn("id", assetsIds).update({ promptState: "Generating" });

 const getTypeConfig = (
 isDerivative: boolean,
 ): Record<string, { promptKey: string; itemType: ItemType; label: string; nameLabel: string; visualManual: string }> => ({
 role: {
 promptKey: "role-polish",
 itemType: "characters",
 label: "Characterimage",
 nameLabel: "Character",
 visualManual: isDerivative ? "art_character_derivative" : "art_character",
 },
 scene: {
 promptKey: "scene-polish",
 itemType: "scenes",
 label: "Sceneimage",
 nameLabel: "Scene",
 visualManual: isDerivative ? "art_scene_derivative" : "art_scene",
 },
 tool: {
 promptKey: "tool-polish",
 itemType: "props",
 label: "Propimage",
 nameLabel: "Prop",
 visualManual: isDerivative ? "art_prop_derivative" : "art_prop",
 },
 });

 // notresponse
 const limit = pLimit(concurrentCount ?? 1);
 const tasks = items.map((item: { assetsId: number; type: string; name: string; describe: string }) =>
 limit(async () => {
 const assetData = assetsDataMap.get(item.assetsId);
 if (!assetData) return;
 const typeConfig = getTypeConfig(!!assetData.assetsId);
 const config = typeConfig[item.type];
 if (!config) return;
 //getVisual manual
 const visualManual = await u.getArtPrompt(project.artStyle as string, "art_skills", config.visualManual);
 if (!visualManual) {
 await u.db("o_assets").where("id", item.assetsId).update({ promptState: "Generation failed", promptErrorReason: "Visual manualundefined" });
 return;
 }
 const systemPrompt = visualManual;
 try {
 const { _output } = (await u.Ai.Text("universalAi").invoke({
 system: systemPrompt + "\n" + otherTextPrompt,
 messages: [
 {
 role: "user",
 content: `
 **base parameters**
 **${config.nameLabel}settings**
 - ${config.nameLabel}Name:${item.name},
 - ${config.nameLabel}Description:${item.describe},`,
 },
 ],
 })) as any;

 if (!_output) {
 await u.db("o_assets").where("id", item.assetsId).update({ promptState: "Generation failed" });
 return;
 }

 await u.db("o_assets").where("id", item.assetsId).update({ prompt: _output, promptState: "Completed" });
 } catch (e: any) {
 await u
 .db("o_assets")
 .where("id", item.assetsId)
 .update({ promptState: "Failed", promptErrorReason: u.error(e).message });
 }
 }),
 );

 // execute in background, don't wait for results
 Promise.all(tasks).catch((err: any) => {
 res.status(500).send(error(err));
 });

 return res.status(200).send(success({ total: items.length }));
 },
);
