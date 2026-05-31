import { tool, jsonSchema, Tool } from "ai";
import { z } from "zod";
import _ from "lodash";
import ResTool from "@/socket/resTool";
import u from "@/utils";

const deriveAssetSchema = z.object({
 id: z.number().describe("derivedAssetID,add new"),
 assetsId: z.number().describe("relatedofAssetID"),
 prompt: z.string().describe("Generate prompt"),
 name: z.string().describe("derivedAssetName"),
 desc: z.string().describe("derivedasset description"),
 src: z.string().nullable().describe("derivedAssetresourcePath"),
 state: z.enum(["not generated", "Generating", "Completed", "Generation failed"]).describe("derivedAsset generationStatus"),
 type: z.enum(["role", "tool", "scene", "clip"]).describe("derivedAssetType"),
});
export const assetItemSchema = z.object({
 id: z.number().describe("Asset"),
 name: z.string().describe("AssetName"),
 type: z.enum(["role", "tool", "scene", "clip"]).describe("AssetType"),
 prompt: z.string().describe("Generate prompt"),
 desc: z.string().describe("asset description"),
 derive: z.array(deriveAssetSchema).describe("derivedAssetlist"),
});
const storyboardSchema = z.object({
 id: z.number().describe("StoryboardIDid"),
 duration: z.number().describe("when()"),
 prompt: z.string().describe("Generate prompt"),
 associateAssetsIds: z.array(z.number()).describe("relatedAssetIDlist"),
 src: z.string().nullable().describe("StoryboardresourcePath"),
 index: z.number().nullable().optional().describe("StoryboardSortfield"),
});
const workbenchDataSchema = z.object({
 name: z.string().describe("ProjectName"),
 duration: z.string().describe("when"),
 resolution: z.string().describe(""),
 fps: z.string().describe(""),
 cover: z.string().optional().describe("imagePath"),
 gradient: z.string().optional().describe("gradientConfiguration"),
});
const posterItemSchema = z.object({
 id: z.number().describe("ID"),
 image: z.string().describe("imagePath"),
});
export const flowDataSchema = z.object({
 script: z.string().describe("Scriptcontent"),
 scriptPlan: z.string().describe(""),
 assets: z.array(assetItemSchema).describe("derivedAsset"),
 storyboardTable: z.string().describe("Storyboardtable"),
 storyboard: z.array(storyboardSchema).describe("Storyboard"),
});

export type FlowData = z.infer<typeof flowDataSchema>;

const keySchema = z.enum(Object.keys(flowDataSchema.shape) as [keyof FlowData, ...Array<keyof FlowData>]);
const flowDataKeyLabels = Object.fromEntries(
 Object.entries(flowDataSchema.shape).map(([key, schema]) => [key, (schema as z.ZodTypeAny).description ?? key]),
) as Record<keyof FlowData, string>;

interface ToolConfig {
 resTool: ResTool;
 toolsNames?: string[];
 msg: ReturnType<ResTool["newMessage"]>;
}

export default (toolCpnfig: ToolConfig) => {
 const { resTool, toolsNames, msg } = toolCpnfig;
 const { socket } = resTool;
 const tools: Record<string, Tool> = {
 get_flowData: tool({
 description: "get workspace data",
 inputSchema: jsonSchema<{ key: keyof FlowData }>(
 z
 .object({
 key: keySchema.describe("datakey"),
 })
 .toJSONSchema(),
 ),
 execute: async ({ key }) => {
 const thinking = msg.thinking(`fetching${flowDataKeyLabels[key]}data...`);
 console.log("[tools] get_flowData", key);
 const flowData: FlowData = await new Promise((resolve) => socket.emit("getFlowData", { key }, (res: any) => resolve(res)));
 thinking.appendText(`get${flowDataKeyLabels[key]}:\n` + JSON.stringify(flowData[key], null, 2));
 thinking.updateTitle(`get${flowDataKeyLabels[key]}Complete`);
 thinking.complete();
 return flowData[key];
 },
 }),
 add_deriveAsset: tool({
 description: "add newderivedAsset",
 inputSchema: jsonSchema<{ assetsId: number; id: number | null; name: string; desc: string }>(
 z
 .object({
 assetsId: z.number().describe("relatedofAssetID"),
 id: z.number().nullable().describe("derivedAssetID,add new"),
 name: z.string().describe("derivedAssetName"),
 desc: z.string().describe("derivedasset description"),
 })
 .toJSONSchema(),
 ),
 execute: async (raw) => {
 // LLM "null" null
 const idRaw = raw.id as unknown;
 const normalizedId = idRaw === "null" || idRaw === "" || idRaw === undefined ? null : (idRaw as number | null);
 const deriveAsset = { ...raw, id: normalizedId };

 const thinking = msg.thinking("atAsset...");
 const { projectId, scriptId } = resTool.data;
 const startTime = Date.now();
 const parentAssets = await u.db("o_assets").where("id", deriveAsset.assetsId).select("id", "type").first();
 if (!parentAssets) return "relatedofAsset not found";

 const data = {
 id: deriveAsset.id ?? undefined,
 assetsId: deriveAsset.assetsId,
 projectId,
 name: deriveAsset.name,
 type: parentAssets.type,
 describe: deriveAsset.desc,
 startTime,
 };
 if (deriveAsset.id) {
 await u.db("o_assets").where("id", deriveAsset.id).update(data);
 thinking.appendText(`alreadyderivedAssetID: ${deriveAsset.id}\n`);
 } else {
 const [insertedId] = await u.db("o_assets").insert(data);
 data.id = insertedId;
 await u.db("o_scriptAssets").insert({ scriptId, assetId: insertedId });
 thinking.appendText(`alreadyadd newderivedAssetID: ${insertedId}\n`);
 }
 const res = await new Promise((resolve) => socket.emit("addDeriveAsset", data, (res: any) => resolve(res)));
 thinking.updateTitle("AssetComplete");
 thinking.complete();
 return res ?? "Operation successful";
 },
 }),
 del_deriveAsset: tool({
 description: "DeletederivedAsset",
 inputSchema: jsonSchema<{ assetsId: number; id: number }>(
 z
 .object({
 assetsId: z.number().describe("relatedofAssetID"),
 id: z.number().describe("derivedAssetID"),
 })
 .toJSONSchema(),
 ),
 execute: async ({ assetsId, id }) => {
 const thinking = msg.thinking("atAsset...");
 const { scriptId } = resTool.data;
 await u.db("o_assets").where("id", id).del();
 await u.db("o_scriptAssets").where({ scriptId, assetId: id }).del();
 thinking.appendText(`alreadyDeletederivedAssetID: ${id}\n`);
 const res = await new Promise((resolve) => socket.emit("delDeriveAsset", { assetsId, id }, (res: any) => resolve(res)));
 thinking.updateTitle("AssetComplete");
 thinking.complete();
 return res ?? "Deleted successfully";
 },
 }),
 generate_deriveAsset: tool({
 description: "derivedAssetimage",
 inputSchema: jsonSchema<{ ids: number[] }>(
 z
 .object({
 ids: z.array(z.number()).describe("needof derivedAssetID"),
 })
 .toJSONSchema(),
 ),
 execute: async ({ ids }) => {
 const thinking = msg.thinking("GeneratingderivedAsset...");
 new Promise((resolve) => socket.emit("generateDeriveAsset", { ids }, (res: any) => resolve(res)))
 .then((res) => {
 thinking.appendText(`alreadyderivedAssetID: ${JSON.stringify(res, null, 2)}\n`);
 thinking.updateTitle("derivedAssetopenstartComplete");
 thinking.complete();
 })
 .catch((e) => {
 thinking.appendText("derivedAssetGeneration failed:\n" + u.error(e).message);
 thinking.updateTitle("derivedAssetGeneration failed");
 thinking.complete();
 });

 return "Starting generationderivedAsset";
 },
 }),
 generate_storyboard: tool({
 description: "Generate storyboardimage",
 inputSchema: jsonSchema<{ ids: number[] }>(
 z
 .object({
 ids: z.array(z.number()).describe("getofStoryboardIDsupportsBatch generate"),
 })
 .toJSONSchema(),
 ),
 execute: async ({ ids }) => {
 const thinking = msg.thinking("atGenerate storyboard...");
 new Promise((resolve) => socket.emit("generateStoryboard", { ids }, (res: any) => resolve(res)))
 .then((res) => {
 thinking.appendText("ofStoryboarddata:\n" + JSON.stringify(res, null, 2));
 thinking.updateTitle("StoryboardComplete");
 thinking.complete();
 })
 .catch((e) => {
 thinking.appendText("StoryboardGeneration failed:\n" + u.error(e).message);
 thinking.updateTitle("StoryboardGeneration failed");
 thinking.complete();
 });

 return "openstartGenerate storyboard";
 },
 }),
 };

 return toolsNames ? Object.fromEntries(Object.entries(tools).filter(([n]) => toolsNames.includes(n))) : tools;
};
