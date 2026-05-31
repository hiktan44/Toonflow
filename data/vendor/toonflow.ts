/**
 * Toonflow relatedicial Relay Platform Vendor
 * @version 2.0
 */

// ============================================================
// Typedefinition
// ============================================================

type VideoMode =
 | "singleImage"
 | "startEndRequired"
 | "endFrameOptional"
 | "startFrameOptional"
 | "text"
 | (`videoReference:${number}` | `imageReference:${number}` | `audioReference:${number}`)[];

interface TextModel {
 name: string;
 modelName: string;
 type: "text";
 think: boolean;
}

interface ImageModel {
 name: string;
 modelName: string;
 type: "image";
 mode: ("text" | "singleImage" | "multiReference")[];
 associationSkills?: string;
}

interface VideoModel {
 name: string;
 modelName: string;
 type: "video";
 mode: VideoMode[];
 associationSkills?: string;
 audio: "optional" | false | true;
 durationResolutionMap: { duration: number[]; resolution: string[] }[];
}

interface TTSModel {
 name: string;
 modelName: string;
 type: "tts";
 voices: { title: string; voice: string }[];
}

interface VendorConfig {
 id: string;
 version: string;
 name: string;
 author: string;
 description?: string;
 icon?: string;
 inputs: { key: string; label: string; type: "text" | "password" | "url"; required: boolean; placeholder?: string }[];
 inputValues: Record<string, string>;
 models: (TextModel | ImageModel | VideoModel | TTSModel)[];
}

type ReferenceList =
 | { type: "image"; sourceType: "base64"; base64: string }
 | { type: "audio"; sourceType: "base64"; base64: string }
 | { type: "video"; sourceType: "base64"; base64: string };

interface ImageConfig {
 prompt: string;
 referenceList?: Extract<ReferenceList, { type: "image" }>[];
 size: "1K" | "2K" | "4K";
 aspectRatio: `${number}:${number}`;
}

interface VideoConfig {
 duration: number;
 resolution: string;
 aspectRatio: "16:9" | "9:16";
 prompt: string;
 referenceList?: ReferenceList[];
 audio?: boolean;
 mode: VideoMode[];
}

interface TTSConfig {
 text: string;
 voice: string;
 speechRate: number;
 pitchRate: number;
 volume: number;
 referenceList?: Extract<ReferenceList, { type: "audio" }>[];
}

interface PollResult {
 completed: boolean;
 data?: string;
 error?: string;
}

// ============================================================
//
// ============================================================

declare const axios: any;
declare const logger: (msg: string) => void;
declare const jsonwebtoken: any;
declare const zipImage: (base64: string, size: number) => Promise<string>;
declare const zipImageResolution: (base64: string, w: number, h: number) => Promise<string>;
declare const mergeImages: (base64Arr: string[], maxSize?: string) => Promise<string>;
declare const urlToBase64: (url: string) => Promise<string>;
declare const pollTask: (fn: () => Promise<PollResult>, interval?: number, timeout?: number) => Promise<PollResult>;
declare const createOpenAI: any;
declare const createDeepSeek: any;
declare const createZhipu: any;
declare const createQwen: any;
declare const createAnthropic: any;
declare const createOpenAICompatible: any;
declare const createXai: any;
declare const createMinimax: any;
declare const createGoogleGenerativeAI: any;
declare const exports: {
 vendor: VendorConfig;
 textRequest: (m: TextModel, t: boolean, tl: 0 | 1 | 2 | 3) => any;
 imageRequest: (c: ImageConfig, m: ImageModel) => Promise<string>;
 videoRequest: (c: VideoConfig, m: VideoModel) => Promise<string>;
 ttsRequest: (c: TTSConfig, m: TTSModel) => Promise<string>;
 checkForUpdates?: () => Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }>;
 updateVendor?: () => Promise<string>;
};

// ============================================================
// Vendor configuration
// ============================================================

const vendor: VendorConfig = {
 id: "toonflow",
 version: "2.0",
 author: "Toonflow",
 name: "Toonflow relatedicial Relay Platform",
 description:
 "## Toonflow relatedicial Relay Platform\n\nToonflow relatedicial Relay Platform**textimageaudio**ofRelaysupportsVendorandnotVendorof\n\n🔗 [go toRelayPlatform](https://api.toonflow.net/)\n\nProjectyousupportsunderofopen ☕",
 icon: "",
 inputs: [{ key: "apiKey", label: "API Key", type: "password", required: true }],
 inputValues: {
 apiKey: "",
 baseUrl: "https://api.toonflow.net/v1",
 },
 models: [
 { name: "claude-sonnet-4-6", type: "text", modelName: "claude-sonnet-4-6", think: false },
 { name: "claude-opus-4-6", type: "text", modelName: "claude-opus-4-6", think: false },
 { name: "claude-sonnet-4-5-20250929", type: "text", modelName: "claude-sonnet-4-5-20250929", think: false },
 { name: "claude-opus-4-5-20251101", type: "text", modelName: "claude-opus-4-5-20251101", think: false },
 { name: "claude-haiku-4-5-20251001", type: "text", modelName: "claude-haiku-4-5-20251001", think: false },
 { name: "gpt-5.4", type: "text", modelName: "gpt-5.4", think: false },
 { name: "gpt-5.2", type: "text", modelName: "gpt-5.2", think: false },
 { name: "MiniMax-M2.7", type: "text", modelName: "MiniMax-M2.7", think: true },
 { name: "MiniMax-M2.5", type: "text", modelName: "MiniMax-M2.5", think: true },
 {
 name: "Wan2.6 I2V 1080P (supports)",
 type: "video",
 modelName: "Wan2.6-I2V-1080P",
 mode: ["text", "startEndRequired"],
 durationResolutionMap: [{ duration: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["1080p"] }],
 audio: true,
 },
 {
 name: "Wan2.6 I2V 720P (supports)",
 type: "video",
 modelName: "Wan2.6-I2V-720P",
 mode: ["text", "startEndRequired"],
 durationResolutionMap: [{ duration: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["720p"] }],
 audio: true,
 },
 {
 name: "Seedance 1.5 Pro",
 type: "video",
 modelName: "doubao-seedance-1-5-pro-251215",
 mode: ["text", "endFrameOptional"],
 durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12], resolution: ["480p", "720p", "1080p"] }],
 audio: true,
 },
 {
 name: "vidu2 turbo",
 type: "video",
 modelName: "ViduQ2-turbo",
 mode: ["singleImage", "startEndRequired"],
 durationResolutionMap: [{ duration: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], resolution: ["540p", "720p", "1080p"] }],
 audio: false,
 },
 {
 name: "ViduQ3 pro",
 type: "video",
 modelName: "ViduQ3-pro",
 mode: ["singleImage", "startEndRequired"],
 durationResolutionMap: [{ duration: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], resolution: ["540p", "720p", "1080p"] }],
 audio: false,
 },
 {
 name: "ViduQ2 pro",
 type: "video",
 modelName: "ViduQ2-pro",
 mode: ["singleImage", "startEndRequired"],
 durationResolutionMap: [{ duration: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], resolution: ["540p", "720p", "1080p"] }],
 audio: false,
 },
 {
 name: "Doubao Seedream 5.0 Lite",
 type: "image",
 modelName: "Doubao-Seedream-5.0-Lite",
 mode: ["text", "singleImage", "multiReference"],
 },
 {
 name: "Doubao Seedream 4.5",
 type: "image",
 modelName: "doubao-seedream-4-5-251128",
 mode: ["text", "singleImage", "multiReference"],
 },
 ],
};

// ============================================================
// tool
// ============================================================

// markdown contentextractchapterimage
function extractFirstImageFromMd(content: string) {
 const regex = /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[A-Za-z0-9+/=]+|https?:\/\/[^\s)]+|\/\/[^\s)]+|[^\s)]+)\)/;
 const match = content.match(regex);
 if (!match) return null;
 const raw = match[2].trim();
 const url = raw.startsWith("data:") ? raw : raw.split(/\s+/)[0];
 return { alt: match[1], url, type: url.startsWith("data:image") ? "base64" : "url" };
}

// ============================================================
//
// ============================================================

const textRequest = (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => {
 if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
 const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
 return createOpenAI({ baseURL: vendor.inputValues.baseUrl, apiKey }).chat(model.modelName);
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
 if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
 const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
 const baseUrl = vendor.inputValues.baseUrl;
 const lowerName = model.modelName.toLowerCase();
 const imageBase64List = (config.referenceList ?? []).map((r) => r.base64);

 // Gemini / nano series models: use chat/completions interfacereturnof markdown extractimage
 if (lowerName.includes("gemini") || lowerName.includes("nano")) {
 const imageConfigGoogle: Record<string, string> = {
 aspect_ratio: config.aspectRatio,
 image_size: config.size,
 };
 const messages: any[] = [];
 if (imageBase64List.length) {
 messages.push({
 role: "user",
 content: imageBase64List.map((b) => ({ type: "image_url", image_url: { url: b } })),
 });
 }
 messages.push({ role: "user", content: config.prompt + "Please output the image directly" });
 const body = {
 model: model.modelName,
 messages,
 extra_body: { google: { image_config: imageConfigGoogle } },
 };
 logger(`[imageRequest] use gemini adapter, model: ${model.modelName}`);
 const response = await fetch(`${baseUrl}/chat/completions`, {
 method: "POST",
 headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
 body: JSON.stringify(body),
 });
 if (!response.ok) {
 const errorText = await response.text();
 throw new Error(`Request failed, status code: ${response.status}, Error message: ${errorText}`);
 }
 const data = await response.json();
 const imageResult = extractFirstImageFromMd(data.choices[0].message.content);
 if (!imageResult) throw new Error("Failed to extract image from response");
 if (imageResult.type === "base64") return imageResult.url;
 return await urlToBase64(imageResult.url);
 }

 // / seedream series models: use images/generations interface
 if (lowerName.includes("doubao") || lowerName.includes("seedream")) {
 const effectiveSize = config.size === "1K" ? "2K" : config.size;
 const sizeMap: Record<string, Record<string, string>> = {
 "16:9": { "2K": "2848x1600", "4K": "4096x2304" },
 "9:16": { "2K": "1600x2848", "4K": "2304x4096" },
 };
 const resolvedSize = sizeMap[config.aspectRatio]?.[effectiveSize];
 const body: Record<string, any> = {
 model: model.modelName,
 prompt: config.prompt,
 size: resolvedSize,
 response_format: "url",
 sequential_image_generation: "disabled",
 stream: false,
 watermark: false,
 ...(imageBase64List.length && { image: imageBase64List }),
 };
 logger(`[imageRequest] use doubao adapter, model: ${model.modelName}`);
 const response = await fetch(`${baseUrl}/images/generations`, {
 method: "POST",
 headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
 body: JSON.stringify(body),
 });
 if (!response.ok) {
 const errorText = await response.text();
 throw new Error(`Request failed, status code: ${response.status}, Error message: ${errorText}`);
 }
 const data = await response.json();
 const resultUrl = data.data[0].url;
 return await urlToBase64(resultUrl);
 }

 throw new Error(`Unsupported image model: ${model.modelName}`);
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
 if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
 const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
 const baseUrl = vendor.inputValues.baseUrl;
 const lowerName = model.modelName.toLowerCase();

 // currentof VideoModechapternon-
 const activeMode = config.mode;
 const imageRefs = (config.referenceList ?? []).filter((r) => r.type === "image").map((r) => r.base64);
 const videoRefs = (config.referenceList ?? []).filter((r) => r.type === "video").map((r) => r.base64);
 const audioRefs = (config.referenceList ?? []).filter((r) => r.type === "audio").map((r) => r.base64);

 // build metadata
 let metadata: Record<string, any> = {};

 if (lowerName.includes("wan")) {
 // series
 if ((activeMode === "startEndRequired" || activeMode === "endFrameOptional" || activeMode === "startFrameOptional") && imageRefs.length >= 2) {
 if (imageRefs[0]) metadata.first_frame_url = imageRefs[0];
 if (imageRefs[1]) metadata.last_frame_url = imageRefs[1];
 } else if (imageRefs.length) {
 metadata.img_url = imageRefs[0];
 }
 if (typeof config.audio === "boolean") metadata.audio = config.audio;

 // Wan requires additional size field
 const wanSizeMap: Record<string, Record<string, string>> = {
 "480p": { "16:9": "832*480", "9:16": "480*832" },
 "720p": { "16:9": "1280*720", "9:16": "720*1280" },
 "1080p": { "16:9": "1920*1080", "9:16": "1080*1920" },
 };
 const wanSize = wanSizeMap[config.resolution]?.[config.aspectRatio];
 const body: Record<string, any> = {
 model: model.modelName,
 prompt: config.prompt,
 duration: config.duration,
 size: wanSize,
 metadata,
 };
 logger(`[videoRequest] SubmitWan video task, model: ${model.modelName}`);
 const response = await fetch(`${baseUrl}/video/generations`, {
 method: "POST",
 headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
 body: JSON.stringify(body),
 });
 if (!response.ok) {
 const errorText = await response.text();
 throw new Error(`Request failed, status code: ${response.status}, Error message: ${errorText}`);
 }
 const data = await response.json();
 const taskId = data.id;
 logger(`[videoRequest] taskID: ${taskId}`);
 const res = await pollTask(async () => {
 const queryResponse = await fetch(`${baseUrl}/video/generations/${taskId}`, {
 method: "GET",
 headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
 });
 if (!queryResponse.ok) {
 const errorText = await queryResponse.text();
 throw new Error(`Polling failedStatus code: ${queryResponse.status}, Error message: ${errorText}`);
 }
 const queryData = await queryResponse.json();
 const status = queryData?.status ?? queryData?.data?.status;
 switch (status) {
 case "completed":
 case "SUCCESS":
 case "success":
 return { completed: true, data: queryData.data.result_url };
 case "FAILURE":
 case "failed":
 return { completed: true, error: queryData?.data?.fail_reason ?? "Video generation failed" };
 default:
 return { completed: false };
 }
 });
 if (res.error) throw new Error(res.error);
 return await urlToBase64(res.data!);
 }

 if (lowerName.includes("doubao") || lowerName.includes("seedance")) {
 // /Seedance series
 metadata = {
 ...(typeof config.audio === "boolean" && { generate_audio: config.audio }),
 ratio: config.aspectRatio,
 image_roles: [] as string[],
 references: [] as string[],
 };
 if (Array.isArray(activeMode)) {
 // Multi-reference
 imageRefs.forEach((b) => metadata.references.push(b));
 videoRefs.forEach((b) => metadata.references.push(b));
 audioRefs.forEach((b) => metadata.references.push(b));
 } else if (activeMode === "startEndRequired" || activeMode === "endFrameOptional" || activeMode === "startFrameOptional") {
 imageRefs.forEach((_, i) => (metadata.image_roles as string[]).push(i === 0 ? "first_frame" : "last_frame"));
 } else if (activeMode === "singleImage") {
 imageRefs.forEach(() => (metadata.image_roles as string[]).push("reference_image"));
 }
 } else if (lowerName.includes("vidu")) {
 // Vidu series
 metadata = {
 aspect_ratio: config.aspectRatio,
 audio: config.audio ?? false,
 off_peak: false,
 };
 } else if (lowerName.includes("kling")) {
 // series
 metadata = { aspect_ratio: config.aspectRatio };
 if (Array.isArray(activeMode)) {
 metadata.reference = [...imageRefs, ...videoRefs, ...audioRefs];
 } else if (activeMode === "endFrameOptional" && imageRefs.length) {
 metadata.image_tail = imageRefs[0];
 } else if (activeMode === "startEndRequired" && imageRefs.length >= 2) {
 metadata.image_list = [
 { image_url: imageRefs[0], type: "first_frame" },
 { image_url: imageRefs[1], type: "last_frame" },
 ];
 } else if (activeMode === "singleImage" && imageRefs.length) {
 metadata.image = imageRefs[0];
 }
 }

 // non-Path
 const publicBody: Record<string, any> = {
 model: model.modelName,
 ...(!Array.isArray(activeMode) && imageRefs.length ? { images: imageRefs } : {}),
 prompt: config.prompt,
 duration: config.duration,
 metadata,
 };

 logger(`[videoRequest] Submittask: ${model.modelName}`);
 const response = await fetch(`${baseUrl}/video/generations`, {
 method: "POST",
 headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
 body: JSON.stringify(publicBody),
 });
 if (!response.ok) {
 const errorText = await response.text();
 throw new Error(`Request failed, status code: ${response.status}, Error message: ${errorText}`);
 }
 const data = await response.json();
 const taskId = data.id;
 logger(`[videoRequest] taskID: ${taskId}`);

 const res = await pollTask(async () => {
 const queryResponse = await fetch(`${baseUrl}/video/generations/${taskId}`, {
 method: "GET",
 headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
 });
 if (!queryResponse.ok) {
 const errorText = await queryResponse.text();
 throw new Error(`Polling failedStatus code: ${queryResponse.status}, Error message: ${errorText}`);
 }
 const queryData = await queryResponse.json();
 const status = queryData?.status ?? queryData?.data?.status;
 switch (status) {
 case "completed":
 case "SUCCESS":
 case "success":
 return { completed: true, data: queryData.data.result_url };
 case "FAILURE":
 case "failed":
 return { completed: true, error: queryData?.data?.fail_reason ?? "Video generation failed" };
 default:
 return { completed: false };
 }
 });

 if (res.error) throw new Error(res.error);
 return await urlToBase64(res.data!);
};

const ttsRequest = async (config: TTSConfig, model: TTSModel): Promise<string> => {
 return "";
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
 return { hasUpdate: false, latestVersion: "2.0", notice: "" };
};

const updateVendor = async (): Promise<string> => {
 return "";
};

// ============================================================
// Export
// ============================================================

exports.vendor = vendor;
exports.textRequest = textRequest;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
exports.checkForUpdates = checkForUpdates;
exports.updateVendor = updateVendor;

export {};
