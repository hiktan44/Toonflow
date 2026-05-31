/**
 * Toonflow AIVendortemplate - MiniMax(AI)
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
 uploadReference: (base64: string, fileType: "image" | "audio" | "video") => Promise<ReferenceList>;
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
 id: "minimax",
 version: "2.1",
 author: "Toonflow",
 name: "MiniMax(AI)",
 description: "MiniMaxrelatedicialinterfacesupportsMseriestext modelimage/imageimageimageFirst and last frames \n [go toPlatform](https://minimaxi.com/)",
 inputs: [
 { key: "apiKey", label: "API Key", type: "password", required: true },
 { key: "baseUrl", label: "request URL", type: "url", required: true, placeholder: "examplehttps://api.minimaxi.com" },
 ],
 inputValues: { apiKey: "", baseUrl: "https://api.minimaxi.com" },
 models: [
 // text model
 { name: "MiniMax-M2.7 ()", modelName: "MiniMax-M2.7", type: "text", think: true },
 { name: "MiniMax-M2.7 ()", modelName: "MiniMax-M2.7-highspeed", type: "text", think: true },
 { name: "MiniMax-M2.5 ()", modelName: "MiniMax-M2.5", type: "text", think: true },
 { name: "MiniMax-M2.5 ()", modelName: "MiniMax-M2.5-highspeed", type: "text", think: true },
 { name: "MiniMax-M2.1 (programming edition)", modelName: "MiniMax-M2.1", type: "text", think: true },
 { name: "MiniMax-M2.1 (programming edition)", modelName: "MiniMax-M2.1-highspeed", type: "text", think: true },
 { name: "MiniMax-M2 (Agent)", modelName: "MiniMax-M2", type: "text", think: false },
 // image model
 { name: "imageV1", modelName: "image-01", type: "image", mode: ["text", "singleImage"] },
 { name: "imageV1 Live", modelName: "image-01-live", type: "image", mode: ["text", "singleImage"], associationSkills: "supportsCustomart style" },
 // video model
 {
 name: "2.3",
 modelName: "MiniMax-Hailuo-2.3",
 type: "video",
 mode: ["text", "singleImage"],
 audio: false,
 durationResolutionMap: [
 { duration: [6], resolution: ["768P", "1080P"] },
 { duration: [10], resolution: ["768P"] },
 ],
 },
 {
 name: "2.3",
 modelName: "MiniMax-Hailuo-2.3-Fast",
 type: "video",
 mode: ["text", "singleImage"],
 audio: false,
 durationResolutionMap: [
 { duration: [6], resolution: ["768P", "1080P"] },
 { duration: [10], resolution: ["768P"] },
 ],
 },
 {
 name: "02",
 modelName: "MiniMax-Hailuo-02",
 type: "video",
 mode: ["text", "singleImage", "startEndRequired"],
 audio: false,
 durationResolutionMap: [
 { duration: [6], resolution: ["512P", "768P", "1080P"] },
 { duration: [10], resolution: ["512P", "768P"] },
 ],
 },
 ],
};

// ============================================================
// tool
// ============================================================

/**
 * get
 */
const getHeaders = (): Record<string, string> => {
 const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
 return {
 Authorization: `Bearer ${apiKey}`,
 "Content-Type": "application/json",
 };
};

/**
 * getrequest URL
 */
const getBaseUrl = (): string => {
 return vendor.inputValues.baseUrl.replace(/\/$/, "");
};

/**
 * ReferenceList itemsextract base64 
 */
const extractBase64WithHead = (ref: ReferenceList): string => {
 return ref.base64.startsWith("data:") ? ref.base64 : `data:image/png;base64,${ref.base64}`;
};

// ============================================================
//
// ============================================================

const textRequest = (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => {
 if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
 const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
 const baseUrl = getBaseUrl();

 const openaiBaseUrl = `${baseUrl}/v1`;
 const extraBody = model.think ? { reasoning_split: true } : {};
 return createOpenAI({ baseURL: openaiBaseUrl, apiKey, extraBody }).chat(model.modelName);
};

const uploadReference = async (base64: string, fileType: "image" | "audio" | "video"): Promise<ReferenceList> => {
 // MiniMaxofimageinterface base64return
 if (fileType === "image") {
 const compressed = await zipImage(base64, 10 * 1024);
 return { type: "image", sourceType: "base64", base64: compressed };
 }
 // interfaceofimageis base6420MB
 return { type: fileType, sourceType: "base64", base64 } as ReferenceList;
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
 if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
 const baseUrl = getBaseUrl();
 const headers = getHeaders();

 const reqBody: any = {
 model: model.modelName,
 prompt: config.prompt,
 aspect_ratio: config.aspectRatio,
 response_format: "base64",
 n: 1,
 prompt_optimizer: true,
 aigc_watermark: false,
 };

 // handleimageimage
 const imageRefs = config.referenceList || [];
 if (imageRefs.length > 0) {
 const refBase64 = extractBase64WithHead(imageRefs[0]);
 reqBody.subject_reference = [{ type: "character", image_file: refBase64 }];
 }

 logger("openstartSubmitMiniMaximagetask");
 const resp = await axios.post(`${baseUrl}/v1/image_generation`, reqBody, { headers });
 if (resp.data.base_resp.status_code !== 0) {
 throw new Error(`imageGeneration failed${resp.data.base_resp.status_msg}`);
 }
 if (resp.data.metadata.success_count === 0) {
 throw new Error("imagepromptimage");
 }

 const imgBase64 = resp.data.data.image_base64[0];
 return imgBase64.startsWith("data:") ? imgBase64 : `data:image/png;base64,${imgBase64}`;
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
 if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
 const baseUrl = getBaseUrl();
 const headers = getHeaders();

 const reqBody: any = {
 model: model.modelName,
 prompt: config.prompt,
 duration: config.duration,
 resolution: config.resolution,
 aigc_watermark: false,
 prompt_optimizer: true,
 };

 // extractimageTypeof
 const imageRefs = (config.referenceList || []).filter((r) => r.type === "image");

 if (imageRefs.length > 0) {
 // image20MB
 const compressedImages: string[] = [];
 for (const ref of imageRefs) {
 const base64 = extractBase64WithHead(ref);
 const compressed = await zipImage(base64, 20 * 1024);
 compressedImages.push(compressed);
 }

 if (config.mode.includes("startEndRequired")) {
 if (compressedImages.length < 2) throw new Error("First and last framesneedUploadimage");
 reqBody.first_frame_image = compressedImages[0];
 reqBody.last_frame_image = compressedImages[1];
 } else if (config.mode.includes("singleImage")) {
 reqBody.first_frame_image = compressedImages[0];
 }
 }

 logger("openstartSubmitMiniMaxtask");
 const submitResp = await axios.post(`${baseUrl}/v1/video_generation`, reqBody, { headers });
 if (submitResp.data.base_resp.status_code !== 0) {
 throw new Error(`taskSubmitFailed${submitResp.data.base_resp.status_msg}`);
 }
 const taskId = submitResp.data.task_id;
 logger(`taskSubmitSuccesstaskID: ${taskId}`);

 // PollingtaskStatus
 const pollResult = await pollTask(
 async () => {
 const queryResp = await axios.get(`${baseUrl}/v1/query/video_generation`, {
 headers: getHeaders(),
 params: { task_id: taskId },
 });
 if (queryResp.data.base_resp.status_code !== 0) {
 return { completed: true, error: queryResp.data.base_resp.status_msg };
 }
 const status = queryResp.data.status;
 if (status === "Success") {
 return { completed: true, data: queryResp.data.file_id };
 }
 if (status === "Fail") {
 return { completed: true, error: "Video generation failed" };
 }
 logger(`taskGeneratingcurrentStatus${status}`);
 return { completed: false };
 },
 5000,
 600000,
 );

 if (pollResult.error) throw new Error(pollResult.error);
 const fileId = pollResult.data!;
 logger(`taskGenerated successfullyfileID: ${fileId}`);

 // getDownload
 const fileResp = await axios.get(`${baseUrl}/v1/files/retrieve`, {
 headers: getHeaders(),
 params: { file_id: fileId },
 });
 if (fileResp.data.base_resp.status_code !== 0) {
 throw new Error(`getfileFailed${fileResp.data.base_resp.status_msg}`);
 }
 const downloadUrl = fileResp.data.file.download_url;
 logger(`DownloadRetrieved successfullyopenstartconvert toBase64`);

 return await urlToBase64(downloadUrl);
};

const ttsRequest = async (config: TTSConfig, model: TTSModel): Promise<string> => {
 return "";
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
 return {
 hasUpdate: false,
 latestVersion: "2.0",
 notice:
 "## Version\n1. templatesupports ReferenceList Type\n2. add new uploadReference handle\n3. imageandextract",
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
exports.uploadReference = uploadReference;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
exports.checkForUpdates = checkForUpdates;
exports.updateVendor = updateVendor;

// ensurecurrentfile
export {};