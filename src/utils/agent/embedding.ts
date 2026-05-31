import * as ONNX_WEB from "onnxruntime-web";
import { pipeline, env as transformersEnv, FeatureExtractionPipeline } from "@huggingface/transformers";
import path from "path";
import fs from "fs";
import getPath from "@/utils/getPath";
import db from "@/utils/db";

// ── model configuration ──
// const modelopennxFile = ["all-MiniLM-L6-v2", "onnx", "model_fp16.onnx"]; // model filePath
// const modelDtype = "fp16" as const; // quantizationTypefp32
let extractor: FeatureExtractionPipeline | null = null;

export async function initEmbedding(): Promise<void> {
 if (extractor) return;

 const modelConfigData = await db("o_setting").whereIn("key", ["modelopennxFile", "modelDtype"]);
 const modelObj: Record<string, string> = {};
 Object.entries(modelConfigData).forEach(([key, value]) => {
 modelObj[key] = value as string;
 });
 let modelopennxFile = modelObj?.modelopennxFile ? JSON.parse(modelObj.modelopennxFile) : ["all-MiniLM-L6-v2", "onnx", "model_fp16.onnx"]; // model filePath
 let modelDtype = modelObj?.modelDtype ?? ("fp16" as const); // quantizationTypefp32
 const onnxPath = path.join(getPath("models"), ...modelopennxFile);
 if (!fs.existsSync(onnxPath)) {
 throw new Error(`Embedding File not found: ${onnxPath}`);
 }

 transformersEnv.allowRemoteModels = false;
 transformersEnv.allowLocalModels = true;
 transformersEnv.localModelPath = getPath("models").replace(/\\/g, "/") + "/";

 const modelFolder = modelopennxFile[0];
 // @ts-ignore - pipeline Type
 extractor = await pipeline("feature-extraction", modelFolder, { dtype: modelDtype });
}

export async function getEmbedding(text: string): Promise<number[]> {
 if (!extractor) await initEmbedding();
 const output = await extractor!(text, { pooling: "mean", normalize: true });
 return Array.from(output.data as Float32Array);
}

export function cosineSimilarity(a: number[], b: number[]): number {
 return a.reduce((dot, v, i) => dot + v * b[i], 0);
}

export async function disposeEmbedding(): Promise<void> {
 await extractor?.dispose?.();
 extractor = null;
}
