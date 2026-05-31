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
 | (`videoReference:${number}` | `imageReference:${number}` | `audioReference:${number}`)[]; //Multi-referencereference (number represents limit count)

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

declare const axios: any; // HTTP request library
declare const logger: (msg: string) => void; // log function
declare const jsonwebtoken: any; // JWT library
declare const zipImage: (base64: string, size: number) => Promise<string>; // image compression functionreturnbase64
declare const zipImageResolution: (base64: string, w: number, h: number) => Promise<string>; // image resolution adjustment functionreturnbase64
declare const mergeImages: (base64Arr: string[], maxSize?: string) => Promise<string>; // image merging functionreturnbase64
declare const urlToBase64: (url: string) => Promise<string>; // URL to Base64 functionreturnbase64
declare const pollTask: (fn: () => Promise<PollResult>, interval?: number, timeout?: number) => Promise<PollResult>; // PollingfnintervalPollingtimeoutwhenTimereturnfnofresult
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
 checkForUpdates?: () => Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }>; //Check for updatesreturnwhetherandLatest versionandsupportsMarkdown
 updateVendor?: () => Promise<string>; //returnoftext
};

// ============================================================
// Vendor configuration
// ============================================================

const vendor: VendorConfig = {
 id: "null",
 version: "2.0",
 author: "Toonflow",
 name: "empty template",
 description: "## Development template, you can use this template for Vibe Coding",
 inputs: [
 { key: "apiKey", label: "API Key", type: "password", required: true },
 { key: "baseUrl", label: "request URL", type: "url", required: true, placeholder: "examplehttps://api.openai.com/v1" },
 ],
 inputValues: { apiKey: "", baseUrl: "https://api.openai.com/v1" },
 models: [{ name: "GPT-4o", modelName: "gpt-4o", type: "text", think: false }],
};

// ============================================================
//
// ============================================================

const textRequest = (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => {
 if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
 const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
 return createOpenAI({ baseURL: vendor.inputValues.baseUrl, apiKey }).chat(model.modelName);
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
 return "";
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
 return "";
};

const ttsRequest = async (config: TTSConfig, model: TTSModel): Promise<string> => {
 return "";
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
 return { hasUpdate: false, latestVersion: "2.0", notice: "## Version" };
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

/**
 * ============================================================
 * AI 
 * ============================================================
 *
 * 
 * fileis Toonflow AI VendortemplateAI atVendorwhen
 * the followingPlatformof curl example API Information
 *
 * 
 * atthe followingInformation
 * 1. API of curl examplerequest URLHeadersBody response
 * 2. API ofrelatedicialimage/textcontent
 * 3. needofModel typetext / image / video / tts
 * Informationwhennot API 
 *
 * 
 *
 * 1. 
 * notuse import / requireusefilealreadyofand
 * axiosloggerjsonwebtokenzipImagezipImageResolutionmergeImages
 * urlToBase64pollTask createOpenAIcreateDeepSeekcreateZhipucreateQwen
 * createAnthropiccreateOpenAICompatiblecreateXaicreateMinimax
 * createGoogleGenerativeAI AI SDK 
 *
 * 2. at exports.* of
 * Errorexampleconst API_URL = "https://..."; const MAX_RETRY = 3;
 * needConfigurationofat vendor.inputValues 
 * vendor.inputValues.xxx atConfiguration
 * isusedwhenatof exports.* use
 *
 * 3. at exports.* of
 * textRequest / imageRequest / videoRequest / ttsRequest
 * Pollingresultparseatsplit
 * existsToken 
 * extractfileofatoftool
 * notuse
 *
 * 4. 
 * allusecamelCaseuse UPPER_SNAKE_CASE
 *
 * 5. notneedre-Type
 * filealreadydefinitionallinterfaceandTypeVendorConfigImageConfigVideoConfig
 * TTSConfigTextModelImageModelVideoModelTTSModelReferenceListPollResult 
 * AI whenusenot
 *
 * 6. return
 * - textRequest(model)return AI SDK of chat model createOpenAI create
 * - imageRequest(config, model)return base64 "data:image/png;base64,..."
 * config.referenceList Extract<ReferenceList, { type: "image" }>[] Type
 * items base64 sourceType "base64"
 * - videoRequest(config, model)return base64 "data:video/mp4;base64,..."
 * config.referenceList ReferenceList[] Type image / video / audio 
 * items base64 sourceType "base64"
 * config.mode currentofbased on mode use referenceList
 * - ttsRequest(config, model)return base64 "data:audio/mp3;base64,..."
 * config.referenceList Extract<ReferenceList, { type: "audio" }>[] Typeaudio
 * API returnofis URL non-datawhenuse urlToBase64(url) convert to
 *
 * 7. ReferenceList VideoMode 
 * ReferenceList isofTypeitems
 * - type: "image" | "audio" | "video"Type
 * - sourceType: "base64"currenttemplate base64
 * - base64ofdata
 *
 * VideoMode definitionvideo modelsupportsof
 * - "text"textGenerate video
 * - "singleImage"First frameimage
 * - "startEndRequired"First and last frames
 * - "endFrameOptional"First and last framesLast frameoptional
 * - "startFrameOptional"First and last framesFirst frameoptional
 * - ["imageReference:9", "videoReference:3", "audioReference:3"]
 * tableTypeof
 *
 * at videoRequest config.mode tablecurrently selectedofbased on
 * - config.referenceList extractTypeof
 * - API ofimage//audio
 *
 * 8. taskhandle
 * needPollingoftaskuseof pollTask 
 * const result = await pollTask(async () => {
 * const resp = await axios.get(...);
 * if (resp.data.status === "SUCCESS") return { completed: true, data: resp.data.url };
 * if (resp.data.status === "FAILED") return { completed: true, error: resp.data.message };
 * return { completed: false };
 * }, 5000, 600000); // 5Polling10when
 * if (result.error) throw new Error(result.error);
 * return await urlToBase64(result.data!);
 *
 * 9. Error handling
 * atopenvalidate API Keywhenuse throw new Error("...") 
 * API Request failedwhenresponseextractofError messagenotAbnormal
 *
 * 10. log
 * atrelatedstepuse logger("...") log"openstartSubmittask""taskID: xxx""Polling in progress..."
 * 
 *
 * 11. vendor Configuration
 * - idfilenameusespecialand
 * - versionVersion "x.y"
 * - inputsbased on API ofInformationConfigurationAPI KeySecretrequest URL
 * - modelsbased onPlatformsupportsofmodel listSettings type andfield
 * - VideoModel of mode API supportsof 7 of VideoMode 
 * - VideoModel of audio fieldtruestartaudiofalsenot"optional"optional
 * - VideoModel of durationResolutionMap whenunderoptionalof
 * - VideoModel of associationSkills optionalDescriptionofspecial
 * - ImageModel of mode API supportsofimage"text" text"singleImage" Single image reference"multiReference" image
 * - TTSModel of voices optionaloflist
 *
 * 12. imagehandle
 * - needimagewhenuse zipImage(base64, maxSizeKB)
 * - needimagewhenuse zipImageResolution(base64, width, height)
 * - needimagewhenuse mergeImages(base64Arr, maxSize)
 * - andreturn base64 
 *
 * 13. file
 * oftemplateof
 * Typedefinition → → Vendor configuration → [tooloptional] → → Export
 * notnotDeletealreadyof
 * toolof getHeadersgetBaseUrl
 *
 * 14. Export
 * Exportthe followingfield exports.xxx = xxx 
 * - exports.vendor
 * - exports.textRequest
 * - exports.imageRequest
 * - exports.videoRequest
 * - exports.ttsRequest
 * - exports.checkForUpdatesoptional
 * - exports.updateVendoroptional
 * ofreturn ""notExport
 * fileat the end export {}; ensurefile
 *
 * process
 * generate newVendorwhen
 * 1. Confirmalready curl example API 
 * 2. API of/response
 * 3. template vendor Configurationandof
 * 4. based oncurrenttemplateof ReferenceList definitionby base64 and referenceList
 * 5. needofModel typeofreturn ""
 * 6. ofensurenoErrornoExport
 */
