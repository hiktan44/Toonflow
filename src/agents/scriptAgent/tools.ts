import { tool, jsonSchema, Tool } from "ai";
import u from "@/utils";
import { z } from "zod";
import _ from "lodash";
import ResTool from "@/socket/resTool";

export const ScriptSchema = z.object({
 name: z.string().describe("ScriptName"),
 content: z.string().describe("Scriptcontent"),
});
export const planData = z.object({
 storySkeleton: z.string().describe(""),
 adaptationStrategy: z.string().describe("adaptation strategy"),
 script: z.string().describe("Scriptcontent"),
});

export type planData = z.infer<typeof planData>;

const keySchema = z.enum(Object.keys(planData.shape) as [keyof planData, ...Array<keyof planData>]);
const planDataKeyLabels = Object.fromEntries(
 Object.entries(planData.shape).map(([key, schema]) => [key, (schema as z.ZodTypeAny).description ?? key]),
) as Record<keyof planData, string>;

interface ToolConfig {
 resTool: ResTool;
 toolsNames?: string[];
 msg: ReturnType<ResTool["newMessage"]>;
}

export default (toolCpnfig: ToolConfig) => {
 const { resTool, toolsNames, msg } = toolCpnfig;
 const { socket } = resTool;
 const tools: Record<string, Tool> = {
 get_novel_events: tool({
 description: "getchapterEvent",
 inputSchema: jsonSchema<{ chapterIndexs: number[] }>(
 z
 .object({
 chapterIndexs: z.array(z.number()).describe("chapterof"),
 })
 .toJSONSchema(),
 ),
 execute: async ({ chapterIndexs }) => {
 console.log("[tools] get_novel_events", chapterIndexs);
 const thinking = msg.thinking("atQuerychapterEvent...");
 const data = await u
 .db("o_novel")
 .where("projectId", resTool.data.projectId)
 .select("id", "chapterIndex as index", "reel", "chapter", "chapterData", "event", "eventState")
 .whereIn("chapterIndex", chapterIndexs);
 thinking.appendText("atQuerychapter: " + chapterIndexs.join(","));
 const eventString = data.map((i: any) => [`chapter${i.index}chapter:${i.chapter}Event:${i.event}`].join("\n")).join("\n");
 thinking.appendText("Queryresult:\n" + eventString);
 thinking.updateTitle("QuerychapterEventComplete");
 thinking.complete();
 return eventString ?? "nodata";
 },
 }),
 get_planData: tool({
 description: "get workspace data",
 inputSchema: jsonSchema<{ key: keyof planData }>(
 z
 .object({
 key: keySchema.describe("datakey"),
 })
 .toJSONSchema(),
 ),
 execute: async ({ key }) => {
 console.log("[tools] get_planData", key);
 const thinking = msg.thinking(`fetching${planDataKeyLabels[key]}data...`);
 const planData: planData = await new Promise((resolve) => socket.emit("getPlanData", { key }, (res: any) => resolve(res)));
 thinking.appendText(`get${planDataKeyLabels[key]}:\n` + planData[key]);
 thinking.updateTitle(`get${planDataKeyLabels[key]}Complete`);
 thinking.complete();
 return planData[key] ?? "nodata";
 },
 }),
 get_novel_text: tool({
 description: "Get novelchapterstarttextcontent",
 inputSchema: jsonSchema<{ chapterIndex: string }>(
 z
 .object({
 chapterIndex: z.string().describe("chapter"),
 })
 .toJSONSchema(),
 ),
 execute: async ({ chapterIndex }) => {
 console.log("[tools] get_novel_text", "[tools] get_novel_text", chapterIndex);
 const thinking = msg.thinking(`atGet novelchapteroriginal text...`);
 const data = await u.db("o_novel").where("projectId", resTool.data.projectId).where({ chapterIndex }).select("chapterData").first();
 const text = data && data?.chapterData ? data.chapterData : "";
 thinking.appendText(`getoriginal text:\n` + text);
 thinking.updateTitle(`Get novelchapteroriginal textComplete`);
 thinking.complete();
 return text ?? "nodata";
 },
 }),
 get_script_content: tool({
 description: "getScriptcontent",
 inputSchema: jsonSchema<{ ids: string[] }>(
 z
 .object({
 ids: z.array(z.string()).describe("Scriptid"),
 })
 .toJSONSchema(),
 ),
 execute: async ({ ids }) => {
 console.log("[tools] get_script_content", "[tools] get_script_content", ids);
 const thinking = msg.thinking(`fetchingScriptcontent...`);
 const data = await u.db("o_script").whereIn("id", ids).select("content", "name");
 const text = data && data.length ? data.map((d) => `<scriptItem name="${d.name}">${d.content}</scriptItem>`).join("\n") : "";
 thinking.appendText(`getScriptcontent:\n` + JSON.stringify(data, null, 2));
 thinking.updateTitle(`getScriptcontentComplete`);
 thinking.complete();
 return text ?? "nodata";
 },
 }),
 };
 return toolsNames ? Object.fromEntries(Object.entries(tools).filter(([n]) => toolsNames.includes(n))) : tools;
};
