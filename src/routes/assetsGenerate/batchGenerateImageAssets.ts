import express from "express";
import pLimit from "p-limit";
import u from "@/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

type AssetType = "role" | "scene" | "tool";

interface AssetTypeConfig {
 label: string;
 taskClass: string;
 dir: string;
 promptTitle: string;
 promptEnd: string;
}

const assetTypeConfig: Record<AssetType, AssetTypeConfig> = {
 role: {
 label: "Character",
 taskClass: "Characterimage",
 dir: "role",
 promptTitle: "Characterimage",
 promptEnd: "Characterimage",
 },
 scene: {
 label: "Scene",
 taskClass: "Sceneimage",
 dir: "scene",
 promptTitle: "Sceneimage",
 promptEnd: "Sceneimage",
 },
 tool: {
 label: "Prop",
 taskClass: "Propimage",
 dir: "props",
 promptTitle: "Propimage",
 promptEnd: "Propimage",
 },
};

function buildPrompt(cfg: AssetTypeConfig, artStyle: string, name: string, prompt: string): string {
 return `
 based on the following${cfg.promptTitle}

 **base parameters**
 - art style: ${artStyle || "specified"}

 **${cfg.label}settings**
 - Name:${name},
 - Prompt:${prompt},

 strictly followSystemspecification to generate${cfg.promptEnd}
 `;
}

const requestSchema = {
 projectId: z.number(),
 model: z.string(),
 resolution: z.string(),
 concurrentCount: z.number().int().min(1).optional(),
 items: z.array(
 z.object({
 id: z.number(),
 type: z.enum(["role", "scene", "tool", "storyboard"]),
 name: z.string(),
 prompt: z.string(),
 base64: z.string().optional().nullable(),
 }),
 ),
};

export default router.post("/", validateFields(requestSchema), async (req, res) => {
 const { projectId, model, resolution, concurrentCount, items } = req.body;

 // 1. QueryProject
 const project = await u.db("o_project").where("id", projectId).select("artStyle", "type", "intro").first();
 if (!project) return res.status(500).send(error("Project"));

 // 2. items o_image imageId list
 const totalNovelId: number[] = [];
 for (const item of items) {
 const [imageId] = await u.db("o_image").insert({
 type: item.type,
 state: "Generating",
 assetsId: item.id,
 });
 await u.db("o_assets").where("id", item.id).update({ imageId });
 totalNovelId.push(imageId);
 }

 // 3. notresponse
 const limit = pLimit(concurrentCount ?? 1);

 const tasks = items.map((item: { id: number; type: string; name: string; prompt: string; base64: string | null | undefined }, index: number) =>
 limit(async () => {
 const imageId = totalNovelId[index];
 const data = await u.db("o_image").where("id", imageId).select("state").first();
 if (data?.state === "Generation failed") {
 return;
 }
 const cfg = assetTypeConfig[item.type as AssetType];
 if (!cfg) return;

 await u.db("o_assets").where("id", item.id).update({ imageId });

 const imagePath = `/${projectId}/${cfg.dir}/${uuidv4()}.jpg`;
 const userPrompt = buildPrompt(cfg, project.artStyle ?? "", item.name, item.prompt);
 const describe = `${cfg.label}imageName${item.name}Prompt${item.prompt}`;
 const relatedObjects = { id: item.id, projectId, type: cfg.label };
 try {
 const aiImage = u.Ai.Image(model);
 await aiImage.run(
 {
 prompt: userPrompt,
 referenceList: item.base64 ? [{ base64: item.base64, type: "image" }] : [],
 size: resolution,
 aspectRatio: "16:9",
 },
 {
 taskClass: cfg.taskClass,
 describe,
 projectId,
 relatedObjects: JSON.stringify(relatedObjects),
 },
 );
 aiImage.save(imagePath);

 const imageData = await u.db("o_image").where("id", imageId).select("*").first();
 if (!imageData) return res.status(500).send("AssetalreadyDelete");
 if (!imageData) return;
 if (imageData.state === "Generation failed") return;
 await u
 .db("o_image")
 .where("id", imageId)
 .update({
 state: "Completed",
 filePath: imagePath,
 type: item.type,
 model: model.split(/:(.+)/)[1],
 resolution,
 });

 await u.db("o_assets").where("id", item.id).update({ imageId });
 } catch (e: any) {
 await u
 .db("o_image")
 .where("id", imageId)
 .update({ state: "Generation failed", errorReason: u.error(e).message });
 }
 }),
 );

 // execute in background, don't wait for results
 Promise.all(tasks).catch(() => {});

 return res.status(200).send(success({ total: items.length }));
});
