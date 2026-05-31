import { Socket } from "socket.io";
import { tool, jsonSchema } from "ai";
import { z } from "zod";
import u from "@/utils";
import Memory from "@/utils/agent/memory";
import useTools from "@/agents/scriptAgent/tools";
import ResTool from "@/socket/resTool";
import * as fs from "fs";
import path from "path";

export interface AgentContext {
 socket: Socket;
 isolationKey: string;
 text: string;
 userMessageTime?: number;
 abortSignal?: AbortSignal;
 resTool: ResTool;
 msg: ReturnType<ResTool["newMessage"]>;
 thinkConfig: {
 think: boolean;
 thinlLevel: 0 | 1 | 2 | 3;
 };
}

function buildMemPrompt(mem: Awaited<ReturnType<Memory["get"]>>): string {
 let memoryContext = "";
 if (mem.rag.length) {
 memoryContext += `[related]\n${mem.rag.map((r) => r.content).join("\n")}`;
 }
 if (mem.summaries.length) {
 if (memoryContext) memoryContext += "\n\n";
 memoryContext += `[summary]\n${mem.summaries.map((s, i) => `${i + 1}. ${s.content}`).join("\n")}`;
 }
 if (mem.shortTerm.length) {
 if (memoryContext) memoryContext += "\n\n";
 memoryContext += `[]\n${mem.shortTerm.map((m) => `${m.role}: ${m.content}`).join("\n")}`;
 }
 return `## Memory\nthe followingisyour memory of the user, for reference but don't proactively mention\n${memoryContext}`;
}

export async function runDecisionAI(ctx: AgentContext) {
 const { isolationKey, text, userMessageTime, abortSignal, resTool } = ctx;
 const memory = new Memory("scriptAgent", isolationKey);
 await memory.add("user", text, { createTime: userMessageTime });

 const skill = path.join(u.getPath("skills"), "script_agent_decision.md");
 const prompt = await fs.promises.readFile(skill, "utf-8");

 const mem = buildMemPrompt(await memory.get(text));

 const projectData = await u.db("o_project").where("id", resTool.data.projectId).first();

 const novelData = await u.db("o_novel").where("projectId", resTool.data.projectId).select("chapterIndex");

 const projectInfo = [
 "## ProjectInformation",
 `NovelName${projectData?.name ?? "Unknown"}`,
 `NovelType${projectData?.type ?? "Unknown"}`,
 `Novel${projectData?.intro ?? "no"}`,
 `Visual manual|art style${projectData?.artStyle ?? "no"}`,
 `${projectData?.videoRatio ?? "16:9"}`,
 `chapters${novelData.length}chapter`,
 ].join("\n");

 const { fullStream } = await u.Ai.Text("scriptAgent:decisionAgent", ctx.thinkConfig.think, ctx.thinkConfig.thinlLevel).stream({
 messages: [
 { role: "system", content: prompt },
 { role: "assistant", content: projectInfo + "\n" + mem },
 { role: "user", content: text },
 ],
 abortSignal,
 tools: {
 ...memory.getTools(),
 ...useTools({ resTool: ctx.resTool, msg: ctx.msg }),
 ...createSubAgent(ctx),
 },
 onFinish: async (completion) => {
 await memory.add("assistant:decision", removeAllXmlTags(completion.text));
 },
 });

 let currentMsg = ctx.msg;
 await consumeFullStream(fullStream, currentMsg, () => {
 if (ctx.msg === currentMsg) return currentMsg;
 currentMsg.complete();
 currentMsg = ctx.msg;
 return currentMsg;
 });
}

function createSubAgent(parentCtx: AgentContext) {
 const { resTool, abortSignal } = parentCtx;
 const memory = new Memory("scriptAgent", parentCtx.isolationKey);

 async function runAgent({
 key,
 prompt,
 system,
 name,
 memoryKey,
 tools: extraTools,
 messages,
 }: {
 key: `${string}:${string}`;
 prompt: string;
 system: string;
 name: string;
 memoryKey: string;
 tools?: Record<string, any>;
 messages?: { role: "user" | "assistant" | "system"; content: string }[];
 }) {
 parentCtx.msg.complete();
 const subMsg = resTool.newMessage("assistant", name);

 const { fullStream } = await u.Ai.Text(key, parentCtx.thinkConfig.think, parentCtx.thinkConfig.thinlLevel).stream({
 system,
 messages: messages ?? [{ role: "user", content: prompt }],
 abortSignal,
 tools: { ...extraTools, ...useTools({ resTool, msg: subMsg }) },
 });

 const fullResponse = await consumeFullStream(fullStream, subMsg);

 if (fullResponse.trim()) {
 await memory.add(memoryKey, removeAllXmlTags(fullResponse), {
 name,
 createTime: new Date(subMsg.datetime).getTime(),
 });
 }

 parentCtx.msg = resTool.newMessage("assistant", "video planning");
 return fullResponse;
 }

 const promptInput = z
 .object({
 prompt: z.string().describe("childAgentoftaskDescription100"),
 })
 .toJSONSchema();

 const run_sub_agent_storySkeleton = tool({
 description: "subAgentCompleterelatedtask",
 inputSchema: jsonSchema<{ prompt: string }>(promptInput),
 execute: async ({ prompt }) => {
 const skill = path.join(u.getPath("skills"), "script_execution_skeleton.md");
 const systemPrompt = await fs.promises.readFile(skill, "utf-8");

 const formatPrompt = "\nyouuseunderXML\n<storySkeleton>content</storySkeleton>";

 return runAgent({
 key: "scriptAgent:storySkeletonAgent",
 prompt,
 system: systemPrompt + formatPrompt,
 name: "",
 memoryKey: "assistant:execution:storySkeleton",
 messages: [{ role: "user", content: prompt + formatPrompt }],
 });
 },
 });

 const run_sub_agent_adaptationStrategy = tool({
 description: "subAgentCompleteadaptation strategyrelatedtask",
 inputSchema: jsonSchema<{ prompt: string }>(promptInput),
 execute: async ({ prompt }) => {
 const skill = path.join(u.getPath("skills"), "script_execution_adaptation.md");
 const systemPrompt = await fs.promises.readFile(skill, "utf-8");

 const formatPrompt = "\nyouuseunderXML\n<adaptationStrategy>adaptation strategy content</adaptationStrategy>";

 return runAgent({
 key: "scriptAgent:adaptationStrategyAgent",
 prompt,
 system: systemPrompt + formatPrompt,
 name: "",
 memoryKey: "assistant:execution:adaptationStrategy",
 messages: [{ role: "user", content: prompt + formatPrompt }],
 });
 },
 });

 const run_sub_agent_script = tool({
 description: "subAgentCompleteScriptrelatedtask",
 inputSchema: jsonSchema<{ prompt: string }>(promptInput),
 execute: async ({ prompt }) => {
 const skill = path.join(u.getPath("skills"), "script_execution_script.md");
 const systemPrompt = await fs.promises.readFile(skill, "utf-8");

 const scriptList = await u.db("o_script").where("projectId", resTool.data.projectId).select("id", "name");
 const scriptPrompt = ["## Script(ID:Name)", scriptList.map((s: any) => `${s.id}:${(s.name || "").replace(/[,:]/g, "")}`).join(","), ""].join(
 "\n",
 );

 const novelData = await u.db("o_novel").where("projectId", resTool.data.projectId).select("chapterIndex");

 const formatPrompt = `\nyouuseunderXML\nXMLnotAddTags<scriptItem name="ScriptName">Scriptcontent</scriptItem><scriptItem name="ScriptName">Scriptcontent</scriptItem><scriptItem name="ScriptName">Scriptcontent</scriptItem>`;

 return runAgent({
 key: "scriptAgent:scriptAgent",
 prompt,
 system: systemPrompt + formatPrompt,
 messages: [
 { role: "assistant", content: scriptPrompt + `chapters${novelData.length}chapter` },
 { role: "user", content: prompt + formatPrompt },
 ],
 name: "",
 memoryKey: "assistant:execution:script",
 });
 },
 });

 const run_supervision_agent = tool({
 description: "subAgenttaskCompletereturnresult",
 inputSchema: jsonSchema<{ prompt: string }>(promptInput),
 execute: async ({ prompt }) => {
 const skill = path.join(u.getPath("skills"), "script_agent_supervision.md");
 const systemPrompt = await fs.promises.readFile(skill, "utf-8");

 return runAgent({
 key: "scriptAgent:supervisionAgent",
 prompt,
 system: systemPrompt,
 name: "Edit",
 memoryKey: "assistant:supervision",
 });
 },
 });

 return {
 run_sub_agent_storySkeleton,
 run_sub_agent_adaptationStrategy,
 run_sub_agent_script,
 run_supervision_agent,
 };
}

async function consumeFullStream(
 fullStream: AsyncIterable<any>,
 initialMsg: ReturnType<ResTool["newMessage"]>,
 syncMsg?: () => ReturnType<ResTool["newMessage"]>,
): Promise<string> {
 let msg = initialMsg;
 let text = msg.text();
 let thinking: ReturnType<typeof msg.thinking> | null = null;
 let thinkTime = 0;
 let fullResponse = "";

 try {
 for await (const chunk of fullStream) {
 await new Promise<void>((resolve) => setTimeout(() => resolve(), 1));
 if (syncMsg) {
 const newMsg = syncMsg();
 if (newMsg !== msg) {
 msg = newMsg;
 text = msg.text();
 }
 }
 if (chunk.type === "reasoning-start") {
 thinkTime = Date.now();
 thinking = msg.thinking("Thinking...");
 } else if (chunk.type === "reasoning-delta") {
 thinking?.append(chunk.text);
 } else if (chunk.type === "reasoning-end") {
 thinkTime = Date.now() - thinkTime;
 thinking?.updateTitle(`${(thinkTime / 1000).toFixed(1)} `);
 thinking?.complete();
 thinking = null;
 } else if (chunk.type === "text-delta") {
 text.append(chunk.text);
 fullResponse += chunk.text;
 } else if (chunk.type === "error") {
 throw chunk.error;
 }
 }
 text.complete();
 msg.complete();
 } catch (err: any) {
 thinking?.complete();
 const errMsg = err?.message ?? String(err);
 text.append(errMsg);
 text.error();
 msg.error();
 throw err;
 }

 return fullResponse;
}

function removeAllXmlTags(text: string): string {
 text = text.replace(/<([a-zA-Z][\w-]*)(\s+[^>]*)?>([\s\S]*?)<\/\1>/g, "");
 text = text.replace(/<([a-zA-Z][\w-]*)(\s+[^>]*)?\/>/g, "");
 text = text.replace(/<\/?[a-zA-Z][\w-]*(\s+[^>]*)?>/g, "");
 return text.trim();
}
