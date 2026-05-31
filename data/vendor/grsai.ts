/**
 * Toonflow AIVendortemplate
 * @version 2.0
 */

// ============================================================
// Typedefinition
// ============================================================

type VideoMode =
 | "singleImage" //Single image reference
 | "startEndRequired" //First and last framesboth are required
 | "endFrameOptional" //First and last framesLast frameoptional
 | "startFrameOptional" //First and last framesFirst frameoptional
 | "text" //text
 | (
 | `videoReference:${number}`
 | `imageReference:${number}`
 | `audioReference:${number}`
 )[]; //Multi-referencereference (number represents limit count)

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
 id: string; //unique ID, stored as filename on user disk, symbols prohibited
 version: string; //Version number, format is x.y, must follow semantic versioning
 name: string; //VendorName
 author: string; //Author
 description?: string; //Description, supports Markdown format
 icon?: string; //Icon, only supports Base64 format, recommended size 128x128 pixels
 inputs: {
 key: string;
 label: string;
 type: "text" | "password" | "url";
 required: boolean;
 placeholder?: string;
 }[];
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

declare const axios: any; // HTTP request library
declare const logger: (msg: string) => void; // log function
declare const jsonwebtoken: any; // JWT library
declare const zipImage: (base64: string, size: number) => Promise<string>; // image compression functionreturnbase64
declare const zipImageResolution: (
 base64: string,
 w: number,
 h: number,
) => Promise<string>; // image resolution adjustment functionreturnbase64
declare const mergeImages: (
 base64Arr: string[],
 maxSize?: string,
) => Promise<string>; // image merging functionreturnbase64
declare const urlToBase64: (url: string) => Promise<string>; // URL to Base64 functionreturnbase64
declare const pollTask: (
 fn: () => Promise<PollResult>,
 interval?: number,
 timeout?: number,
) => Promise<PollResult>; // PollingfnintervalPollingtimeoutwhenTimereturnfnofresult
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
 textRequest: (m: TextModel, t: boolean, tl: 0 | 1 | 2 | 3) => any; //text model
 imageRequest: (c: ImageConfig, m: ImageModel) => Promise<string>; //image modelreturnbase64
 videoRequest: (c: VideoConfig, m: VideoModel) => Promise<string>; //video modelreturnbase64
 ttsRequest: (c: TTSConfig, m: TTSModel) => Promise<string>; //openspeech modelreturnbase64
 checkForUpdates?: () => Promise<{
 hasUpdate: boolean;
 latestVersion: string;
 notice: string;
 }>; //Check for updatesreturnwhetherandLatest versionandsupportsMarkdown
 updateVendor?: () => Promise<string>; //returnoftext
};

// ============================================================
// Vendor configuration
// ============================================================

const vendor: VendorConfig = {
 id: "grsai",
 version: "2.1",
 author: "Toonflow",
 name: "Grsai",
 description:
 "Grsai AIPlatformsupportsimageimageimageGeminitext model \n [go toRelayPlatform](https://tf.grsai.ai/zh)",
 inputs: [
 { key: "apiKey", label: "API Key", type: "password", required: true },
 {
 key: "baseUrl",
 label: "request URL",
 type: "url",
 required: true,
 placeholder: "examplehttps://grsai.dakka.com.cn",
 },
 ],
 inputValues: { apiKey: "", baseUrl: "https://grsai.dakka.com.cn" },
 models: [
 {
 name: "GPT Image 2",
 modelName: "gpt-image-2",
 type: "image",
 mode: ["text", "singleImage", "multiReference"],
 },
 {
 name: "Nano Banana Fast",
 modelName: "nano-banana-fast",
 type: "image",
 mode: ["text", "singleImage", "multiReference"],
 },
 {
 name: "Nano Banana 2",
 modelName: "nano-banana-2",
 type: "image",
 mode: ["text", "singleImage", "multiReference"],
 },
 {
 name: "Nano Banana Pro",
 modelName: "nano-banana-pro",
 type: "image",
 mode: ["text", "singleImage", "multiReference"],
 },
 ],
};

// ============================================================
// tool
// ============================================================

const getHeaders = () => {
 const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
 return {
 "Content-Type": "application/json",
 Authorization: `Bearer ${apiKey}`,
 };
};

// ============================================================
//
// ============================================================

const textRequest = (
 model: TextModel,
 think: boolean,
 thinkLevel: 0 | 1 | 2 | 3,
) => {
 if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
 const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
 return createGoogleGenerativeAI({
 baseURL: `${vendor.inputValues.baseUrl}/v1beta`,
 apiKey,
 }).chat(model.modelName);
};

const imageRequest = async (
 config: ImageConfig,
 model: ImageModel,
): Promise<string> => {
 if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
 const baseUrl = vendor.inputValues.baseUrl;
 const headers = getHeaders();

 //
 const requestBody: any = {
 model: model.modelName,
 prompt: config.prompt,
 aspectRatio: config.aspectRatio,
 webHook: "-1",
 shutProgress: true,
 };

 //
 if (model.modelName.startsWith("nano-banana")) {
 requestBody.imageSize = config.size;
 } else {
 requestBody.size = config.aspectRatio;
 requestBody.variants = 1;
 }

 // handleimage
 if (config.referenceList && config.referenceList.length > 0) {
 requestBody.urls = config.referenceList.map((img) => img.base64);
 }

 // interfacePath
 const apiPath = model.modelName.startsWith("nano-banana")
 ? "/v1/draw/nano-banana"
 : "/v1/draw/completions";

 logger(`openstartSubmitimagetask${model.modelName}`);
 const submitResp = await axios.post(`${baseUrl}${apiPath}`, requestBody, {
 headers,
 });
 if (submitResp.data.code !== 0)
 throw new Error(`taskSubmitFailed${submitResp.data.msg}`);

 const taskId = submitResp.data.data.id;
 logger(`imagetaskSubmitSuccesstaskID${taskId}`);

 // Pollingresult
 const pollResult = await pollTask(
 async () => {
 const resp = await axios.post(
 `${baseUrl}/v1/draw/result`,
 { id: taskId },
 { headers },
 );
 if (resp.data.code !== 0)
 return { completed: true, error: resp.data.msg };

 const taskData = resp.data.data;
 if (taskData.status === "failed")
 return {
 completed: true,
 error: taskData.failure_reason || taskData.error,
 };
 if (taskData.status === "succeeded") {
 const imgUrl = taskData.results?.[0]?.url || taskData.url;
 return { completed: true, data: imgUrl };
 }
 logger(`imagetaskGenerating${taskData.progress}%`);
 return { completed: false };
 },
 3000,
 600000,
 );

 if (pollResult.error) throw new Error(pollResult.error);
 logger(`imageCompleteopenstartconvert toBase64`);
 return await urlToBase64(pollResult.data!);
};

const videoRequest = async (
 config: VideoConfig,
 model: VideoModel,
): Promise<string> => {
 if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
 const baseUrl = vendor.inputValues.baseUrl;
 const headers = getHeaders();

 //
 const requestBody: any = {
 model: model.modelName,
 prompt: config.prompt,
 aspectRatio: config.aspectRatio,
 webHook: "-1",
 shutProgress: true,
 };

 // handleresource
 if (config.referenceList && config.referenceList.length > 0) {
 const imageRefs = config.referenceList.filter(
 (item) => item.type === "image",
 ) as Extract<ReferenceList, { type: "image" }>[];
 if (config.mode.includes("endFrameOptional") && imageRefs.length >= 1) {
 requestBody.firstFrameUrl = imageRefs[0].base64;
 if (imageRefs.length >= 2) requestBody.lastFrameUrl = imageRefs[1].base64;
 } else if (
 config.mode.some(
 (m) => Array.isArray(m) && m.includes("imageReference:3"),
 )
 ) {
 requestBody.urls = imageRefs.map((img) => img.base64);
 }
 }

 logger(`openstartSubmittask${model.modelName}`);
 const submitResp = await axios.post(`${baseUrl}/v1/video/veo`, requestBody, {
 headers,
 });
 if (submitResp.data.code !== 0)
 throw new Error(`taskSubmitFailed${submitResp.data.msg}`);

 const taskId = submitResp.data.data.id;
 logger(`taskSubmitSuccesstaskID${taskId}`);

 // Pollingresult
 const pollResult = await pollTask(
 async () => {
 const resp = await axios.post(
 `${baseUrl}/v1/draw/result`,
 { id: taskId },
 { headers },
 );
 if (resp.data.code !== 0)
 return { completed: true, error: resp.data.msg };

 const taskData = resp.data.data;
 if (taskData.status === "failed")
 return {
 completed: true,
 error: taskData.failure_reason || taskData.error,
 };
 if (taskData.status === "succeeded") {
 return { completed: true, data: taskData.url };
 }
 logger(`taskGenerating${taskData.progress}%`);
 return { completed: false };
 },
 5000,
 1800000,
 );

 if (pollResult.error) throw new Error(pollResult.error);
 logger(`Completeopenstartconvert toBase64`);
 return await urlToBase64(pollResult.data!);
};

const ttsRequest = async (
 config: TTSConfig,
 model: TTSModel,
): Promise<string> => {
 return "";
};

const checkForUpdates = async (): Promise<{
 hasUpdate: boolean;
 latestVersion: string;
 notice: string;
}> => {
 return {
 hasUpdate: false,
 latestVersion: "1.0",
 notice: "## Version",
 };
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

// ensurecurrentfile
export {};
