import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import { z } from "zod";
import { tool, jsonSchema } from "ai";
const router = express.Router();

// check language model
export default router.post(
 "/",
 validateFields({
 modelName: z.string(),
 type: z.enum(["text", "video", "image"]),
 id: z.string(),
 }),
 async (req, res) => {
 const { modelName, type, id } = req.body;

 try {
 const requestFn: Record<string, { fnName: string; modelData?: any }> = {
 text: { fnName: "textRequest" },
 image: {
 fnName: "imageRequest",
 modelData: {
 prompt:
 "16:9ratioofimage2x2no\nof\noftable\nBottom-left grid: a sturdy bull, pastoral background, gentle gaze, glossy coat\nBottom-right grid: a majestic horse, elegant pose, flowing mane, muscular build\nandart styleitemsofandand/", //imagePrompt
 referenceList: [], //inputimagePrompt
 size: "1K", // image
 aspectRatio: "16:9",
 },
 },
 video: { fnName: "videoRequest", modelData: {} },
 } as const;
 const vendorConfigData = await u.db("o_vendorConfig").where("id", id).first();

 if (!vendorConfigData) return res.status(500).send(error("Vendor configuration not found"));
 if (!vendorConfigData.models) return res.status(500).send(error("not foundmodel list"));

 const modelList = await u.vendor.getModelList(vendorConfigData.id!);

 const selectedModel = modelList.find((i: any) => i.modelName == modelName);
 if (type == "video") {
 requestFn["video"].modelData = {
 model: modelName,
 duration: selectedModel.durationResolutionMap[0].duration[0],
 resolution: selectedModel.durationResolutionMap[0].resolution[0],
 aspectRatio: "16:9",
 prompt:
 "A shirtless middle-aged man with a horse head is standing in a supermarket, carefully comparing two identical bottles of shampoo for 3 seconds, then suddenly bursts into tears, drops to his knees dramatically, a flock of pigeons explodes out of nowhere from behind him, the supermarket lights flicker, an old grandma nearby continues shopping completely unbothered, the horse head man instantly stops crying, puts both shampoo bottles back, and moonwalks away disappearing into the vegetable section. Security camera footage style, slightly grainy, 5 seconds.",
 referenceList: [],
 audio: false,
 mode: "text",
 };
 }
 const reqConfig = requestFn[type as "text" | "video" | "image"];

 const getWeatherTool = tool({
 description: "Get the weather in a location",
 inputSchema: jsonSchema<{ location: string }>(
 z
 .object({
 location: z.string().describe("The location to get the weather for"),
 })
 .toJSONSchema(),
 ),
 execute: async ({ location }) => {
 return {
 location,
 temperature: 72 + Math.floor(Math.random() * 21) - 10,
 };
 },
 });

 if (type == "text") {
 const { textStream } = await u.Ai.Text(`${id}:${modelName}`).stream({
 prompt: "Please call the tool to get Mars weather and tell me the temperature",
 tools: { getWeatherTool },
 });
 let fullResponse = "";
 for await (const chunk of textStream) {
 fullResponse += chunk;
 }
 if (!fullResponse) return res.status(500).send(error("Model did not return result"));
 res.status(200).send(success(fullResponse));
 } else {
 const aiTypeFn = {
 image: "Image",
 video: "Video",
 } as const;
 const reqFn = await u.Ai[aiTypeFn[type as "image" | "video"]](`${id}:${modelName}`).run({
 ...reqConfig.modelData,
 });
 await reqFn.save(type == "video" ? "test.mp4" : "testImage.jpg");
 const resultUrl = await u.oss.getFileUrl(type == "video" ? "test.mp4" : "testImage.jpg");
 res.status(200).send(success(resultUrl));
 }
 } catch (err) {
 console.error(err);
 const msg = u.error(err).message;
 console.error(msg);
 res.status(500).send(error(msg));
 }
 },
);
