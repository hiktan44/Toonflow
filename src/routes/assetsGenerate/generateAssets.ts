import express from "express";
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

// ─── buildGenerate prompt ──────────────────────────────────────────

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

// ─── Generate asset image ────────────────────────────────────────────

const requestSchema = {
 projectId: z.number(),
 model: z.string(),
 resolution: z.string(),
 id: z.number(),
 type: z.enum(["role", "scene", "tool", "storyboard"]),
 name: z.string(),
 prompt: z.string(),
 base64: z.string().optional().nullable(),
};

export default router.post("/", validateFields(requestSchema), async (req, res) => {
 const { projectId, model, resolution, id, type, name, prompt, base64 } = req.body;

 // 1. QueryProject & getTypeConfiguration
 const project = await u.db("o_project").where("id", projectId).select("artStyle", "type", "intro").first();
 if (!project) return res.status(500).send(success({ message: "Project" }));

 const cfg = assetTypeConfig[type as AssetType];
 if (!cfg) return res.status(400).send(error("Not supportedofType"));

 // 2. createimage
 const [imageId] = await u.db("o_image").insert({
 type,
 state: "Generating",
 assetsId: id,
 model: model.split(/:(.+)/)[1],
 resolution,
 });
 await u.db("o_assets").where("id", id).update({ imageId });

 // 3. prepare generation params
 const imagePath = `/${projectId}/${cfg.dir}/${uuidv4()}.jpg`;
 const userPrompt = buildPrompt(cfg, project.artStyle!, name, prompt);
 const describe = `${cfg.label}imageName${name}Prompt${prompt}`;
 const relatedObjects = { id, projectId, type: cfg.label };

 try {
 const aiImage = u.Ai.Image(model);
 await aiImage.run(
 {
 prompt: userPrompt,
 referenceList: base64 ? [{ type: "image", base64 }] : [],
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
 // 5. & returnresult
 const imageData = await u.db("o_image").where("id", imageId).select("*").first();
 if (!imageData) return res.status(500).send("AssetalreadyDelete");
 if (imageData.state === "Generation failed") return;
 await u
 .db("o_image")
 .where("id", imageId)
 .update({
 state: "Completed",
 filePath: imagePath,
 type,
 model: model.split(/:(.+)/)[1],
 resolution,
 });

 const path = await u.oss.getSmallImageUrl(imagePath);
 await u.db("o_assets").where("id", id).update({ imageId });

 return res.status(200).send(success({ path, assetsId: id }));
 } catch (e) {
 await u
 .db("o_image")
 .where("id", imageId)
 .update({ state: "Generation failed", errorReason: u.error(e).message });
 return res.status(400).send(error(u.error(e).message || "Image generation failed"));
 }
});
