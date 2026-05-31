/**
 * remove deep thinking model output <think>...</think> Tagsand its content
 *
 * 1. stripThink(text) — for non-streaming, directly remove from complete text <think> 
 * 2. createThinkStreamFilter() — streamreturnStatusof chunk 
 */

/**
 * non-streamremovetextof <think>...</think>
 */
export function stripThink(text: string): string {
 return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

/**
 * streamcreateStatusof chunk 
 *
 * usage
 * ```ts
 * const filter = createThinkStreamFilter();
 * for await (const chunk of textStream) {
 * const filtered = filter.push(chunk);
 * if (filtered) msg.send(filtered);
 * }
 * ```
 */
export function createThinkStreamFilter() {
 let insideThink = false;
 let buffer = "";

 return {
 /**
 * chunkreturnneedoftextempty string
 */
 push(chunk: string): string {
 let output = "";
 let i = 0;

 while (i < chunk.length) {
 if (insideThink) {
 // at <think> look for </think>
 const closeIdx = chunk.indexOf("</think>", i);
 if (closeIdx !== -1) {
 // TagsTagscontent
 insideThink = false;
 i = closeIdx + "</think>".length;
 } else {
 // chunk at think All
 break;
 }
 } else {
 // not in <think> 
 const openIdx = chunk.indexOf("<think>", i);
 if (openIdx !== -1) {
 // openTagsTagsofcontent
 output += buffer + chunk.slice(i, openIdx);
 buffer = "";
 insideThink = true;
 i = openIdx + "<think>".length;
 } else {
 // <think>but possibly chunk at the endisincomplete "<thi..."
 // at the endis "<" openofnotTags
 const potentialStart = findPartialTag(chunk, i);
 if (potentialStart !== -1) {
 output += buffer + chunk.slice(i, potentialStart);
 buffer = chunk.slice(potentialStart);
 } else {
 output += buffer + chunk.slice(i);
 buffer = "";
 }
 break;
 }
 }
 }

 return output;
 },

 /**
 * streamwhenofcontent
 */
 flush(): string {
 const remaining = buffer;
 buffer = "";
 return remaining;
 },
 };
}

/**
 * check chunk[startIdx..] ofat the endwhether "<think>" ofnot
 * "<", "<t", "<th", "<thi", "<thin", "<think"
 * returnnotofstartnot foundreturn -1
 */
function findPartialTag(chunk: string, startIdx: number): number {
 const tag = "<think>";
 // checkat the end tag.length - 1 
 const searchStart = Math.max(startIdx, chunk.length - (tag.length - 1));
 for (let i = searchStart; i < chunk.length; i++) {
 const remaining = chunk.slice(i);
 if (tag.startsWith(remaining)) {
 return i;
 }
 }
 return -1;
}
