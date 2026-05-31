import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { useSkill } from "@/utils/agent/skillsTools";
import { tool, jsonSchema } from "ai";
import { o_script } from "@/types/database";

const router = express.Router();

/** AssetAI ofAssetneedInformation */
const NewAssetSchema = z.object({
 name: z.string().describe("AssetName,NamenotOthertable"),
 desc: z.string().describe("asset description"),
 type: z.enum(["role", "tool", "scene"]).describe("AssetType"),
 scriptIds: z.array(z.number()).describe("useAssetofScriptid"),
});

/** alreadyAssetdataalreadyexistsofAssetNameandrelatedofScript */
const ExistingAssetRefSchema = z.object({
 name: z.string().describe("alreadyAssetofName,alreadyAssetlistofNameconsistent"),
 scriptIds: z.array(z.number()).describe("useAssetofScriptid"),
});

export const AssetSchema = z.object({
 name: z.string().describe("AssetName,NamenotOthertable"),
 desc: z.string().describe("asset description"),
 type: z.enum(["role", "tool", "scene"]).describe("AssetType"),
});

type NewAsset = z.infer<typeof NewAssetSchema>;
type ExistingAssetRef = z.infer<typeof ExistingAssetRefSchema>;
type Asset = z.infer<typeof AssetSchema>;

/** AI ofresult */
type GroupResult = {
 batchScriptIds: number[];
 newAssets: NewAsset[];
 existingRefs: ExistingAssetRef[];
} | null;

/** scriptIds by groupSize */
function chunkArray(arr: number[], groupSize: number): number[][][] {
 const chunks: number[][] = [];
 for (let i = 0; i < arr.length; i += 5) {
 chunks.push(arr.slice(i, i + 5));
 }
 const groupChunks = [];
 for (let i = 0; i < chunks.length; i += groupSize) {
 groupChunks.push(chunks.slice(i, i + groupSize));
 }
 return groupChunks;
}

export default router.post(
 "/",
 validateFields({
 scriptIds: z.array(z.number()),
 projectId: z.number(),
 groupSize: z.number().min(1).optional(),
 }),
 async (req, res) => {
 const { scriptIds, projectId, groupSize = 5 } = req.body;

 if (!scriptIds.length) return res.status(400).send(error("please select firstScript"));
 const scripts = await u.db("o_script").whereIn("id", scriptIds);

 // build scriptId -> script contentmapping
 const scriptMap = new Map(scripts.map((s: o_script) => [s.id, s]));

 await u.db("o_script").whereIn("id", scriptIds).update({
 extractState: 2,
 });

 const errors: { scriptId: number; error: string }[] = [];
 let successCount = 0;

 // scriptIds by groupSizeDefault5 AI
 const scriptGroups = chunkArray(scriptIds as number[], groupSize);

 /** ScriptextractCompleterelated */
 async function persistGroupResult(result: GroupResult) {
 console.log("%c Line:84 🍪 result", "background:#6ec1c2", result);
 if (!result) return;
 const { batchScriptIds, newAssets, existingRefs } = result;
 if (!newAssets.length && !existingRefs.length) return;

 // QueryalreadyAsset
 const existingAssets = await u.db("o_assets").where("projectId", projectId).select("id", "name");
 const existingMap = new Map(existingAssets.map((a) => [a.name!, a.id!]));

 // Assetnot inalreadylistof
 const toInsert = newAssets.filter((asset) => !existingMap.has(asset.name));
 if (toInsert.length) {
 await u.db("o_assets").insert(
 toInsert.map((asset) => ({
 name: asset.name,
 type: asset.type,
 describe: asset.desc,
 projectId: projectId,
 startTime: Date.now(),
 })),
 );
 }

 // re-Querygetof name -> id mapping
 const allAssets = await u.db("o_assets").where("projectId", projectId).select("id", "name");
 const nameToId = new Map(allAssets.map((a) => [a.name, a.id]));

 // collect allAssetScriptofrelatedrelated
 const scriptAssetRows: { scriptId: number; assetId: number }[] = [];

 // Assetofrelated
 for (const asset of newAssets) {
 const assetId = nameToId.get(asset.name);
 if (assetId) {
 for (const sid of asset.scriptIds) {
 scriptAssetRows.push({ scriptId: sid, assetId });
 }
 }
 }

 // alreadyAssetofrelated
 for (const ref of existingRefs) {
 const assetId = nameToId.get(ref.name);
 if (assetId) {
 for (const sid of ref.scriptIds) {
 scriptAssetRows.push({ scriptId: sid, assetId });
 }
 }
 }

 // scriptId + assetId items
 const uniqueRows = [...new Map(scriptAssetRows.map((r) => [`${r.scriptId}_${r.assetId}`, r])).values()];

 // Delete scriptId ofrelatedof
 await u.db("o_scriptAssets").whereIn("scriptId", batchScriptIds).delete();
 if (uniqueRows.length) {
 await u.db("o_scriptAssets").insert(uniqueRows);
 }

 // SuccessofScriptStatus 1Success
 await u.db("o_script").whereIn("id", batchScriptIds).update({
 extractState: 1,
 errorReason: null,
 });
 }
 res.send(success("openstartExtract assets"));

 function processGroup(group: number[][][]) {
 group.map(async (itemIds) => {
 const validScripts: { id: number; script: o_script }[] = [];
 for (const scriptIds of itemIds as number[][]) {
 for (const scriptId of scriptIds) {
 const script = scriptMap.get(scriptId);
 if (!script) {
 errors.push({ scriptId, error: "not foundScript" });
 await u.db("o_script").where("id", scriptId).update({ extractState: -1, errorReason: "not foundScript" });
 } else {
 // Statuswhetherextractextract
 const item = await u.db("o_script").where("id", scriptId).select("extractState").first();
 if (item?.extractState == 2) {
 validScripts.push({ id: scriptId, script });
 }
 }
 }
 }
 if (!validScripts.length) return;
 const validScriptIds = validScripts.map((v) => v.id);
 // editStatusatextract
 await u.db("o_script").whereIn("id", validScriptIds).update({
 extractState: 0, // atextract
 });
 // QuerycurrentProjectalreadyofAssetlist AI 
 const existingAssets = await u.db("o_assets").where("projectId", projectId).select("name", "type");
 const existingAssetsList = existingAssets.map((a) => `${a.name}(${a.type})`).join("");

 // Scriptcontent,mark
 const scriptsContent = validScripts
 .map(({ id, script }) => `===== ScriptID: ${id}${script.name || ""} =====\n${script.content}`)
 .join("\n\n");

 let collectedNew: NewAsset[] = [];
 let collectedExisting: ExistingAssetRef[] = [];
 try {
 const resultTool = tool({
 description: "returnresultwhentool",
 inputSchema: jsonSchema<{ newAssets: NewAsset[]; existingAssetRefs: ExistingAssetRef[] }>(
 z
 .object({
 newAssets: z
 .array(NewAssetSchema)
 .describe("newly discoveredAssetlist (not in existingAssetlist), requires complete promptnamedesctype and using thisAssetof scriptIds"),
 existingAssetRefs: z
 .array(ExistingAssetRefSchema)
 .describe("alreadyAssetoflistatalreadyAssetlistalreadyexistsofAssetNameand using thisAssetof scriptIds"),
 })
 .toJSONSchema(),
 ),
 execute: async ({ newAssets, existingAssetRefs }) => {
 if (newAssets?.length) collectedNew = newAssets;
 if (existingAssetRefs?.length) collectedExisting = existingAssetRefs;
 return "noreply to user with any content";
 },
 });
 const promptData = await u.db("o_prompt").where("type", "scriptAssetExtraction").first();
 let scriptAssetExtraction = "" as string | undefined;
 if (promptData && promptData.useData) {
 scriptAssetExtraction = promptData.useData;
 } else {
 scriptAssetExtraction = promptData?.data ?? undefined;
 }
 const existingHint = existingAssetsList
 ? `\n\nalreadyAssetlist${existingAssetsList}\nalreadyAssetatScriptat existingAssetRefs AssetNameandof scriptIds no desc/typenewly discoveredAssetnot inalreadylistat newAssets Information`
 : "";
 const output = await u.Ai.Text("universalAi").invoke({
 messages: [
 {
 role: "system",
 content:
 scriptAssetExtraction +
 "\n\nextractScriptinvolved inAssetCharacterScenePropreference skill script_assets_extract specification, results must be submitted via resultTool toolreturn" +
 "\n\nwhenScriptScript ===== ScriptID: xxx ===== youneedScriptuseAssetat scriptIds AssetatScript",
 },
 {
 role: "user",
 content: `currentalreadyAssetlist${existingHint}\n\nbased on the following${validScripts.length}ScriptextractofScriptAssetCharacterSceneProp:\n\n${scriptsContent}`,
 },
 ],
 tools: { resultTool },
 });
 await persistGroupResult({
 batchScriptIds: validScriptIds,
 newAssets: collectedNew,
 existingRefs: collectedExisting,
 });
 } catch (e) {
 console.error(`[extractAssets] group=[${validScriptIds.join(",")}] extractFailed:`, e);
 for (const { id, script } of validScripts) {
 errors.push({ scriptId: id, error: (script.name || "") + ":" + u.error(e).message });
 await u
 .db("o_script")
 .where("id", id)
 .update({ extractState: -1, errorReason: u.error(e).message });
 }
 return;
 }
 if (!collectedNew.length && !collectedExisting.length) {
 for (const { id } of validScripts) {
 errors.push({ scriptId: id, error: "AI returnAsset" });
 await u.db("o_script").where("id", id).update({ extractState: -1, errorReason: "AI returnAsset" });
 }
 return;
 }
 });
 }
 processGroup(scriptGroups);
 },
);
