import { EventEmitter } from "events";
import { o_novel } from "@/types/database";
import u from "@/utils";
import { stripThink } from "@/utils/stripThink";
export interface EventType {
 id: number;
 event: string;
}

/* textdata
 * @param textData needoftext
 * @param windowSize Default5
 * @param overlap Default1
 * @returns {totalCharacter:all characterCharacter,totalEvent:allEvent}
 */

class CleanNovel {
 emitter: EventEmitter;
 /** */
 concurrency: number;

 constructor(concurrency: number = 5) {
 this.emitter = new EventEmitter();
 this.concurrency = concurrency;
 }

 private async processChapter(novel: o_novel): Promise<EventType | null> {
 try {
 const prompt = await u.getPrompts("event");
 const promptData = await u.db("o_prompt").where("type", "eventExtraction").first();
 let eventExtraction = "" as string | undefined;
 if (promptData && promptData.useData) {
 eventExtraction = promptData.useData;
 } else {
 eventExtraction = promptData?.data ?? undefined;
 }
 const resData = await u.Ai.Text("universalAi").invoke({
 system: eventExtraction ? JSON.stringify(eventExtraction) : (prompt as string),
 messages: [
 {
 role: "user",
 content:
 "based on the followingNovelchapters" +
 novel.chapterIndex +
 "Novelchapter entry" +
 novel.reel +
 "NovelchapterName" +
 novel.chapter +
 "Novelchapter contentGenerate eventssummary\n" +
 novel.chapterData!,
 },
 ],
 });
 const preData = stripThink(resData.text);
 this.emitter.emit("item", { id: novel.id, event: preData });
 return { id: novel.id!, event: preData };
 } catch (e) {
 this.emitter.emit("item", { id: novel.id, event: null, errorReason: u.error(e).message });
 return null;
 }
 }

 async start(allChapters: o_novel[], projectId: number): Promise<EventType[]> {
 const totalEvent: EventType[] = [];

 // concurrency control: limit concurrent tasks via semaphore
 let running = 0;
 let index = 0;
 const results: Promise<void>[] = [];

 const runNext = (): Promise<void> => {
 if (index >= allChapters.length) return Promise.resolve();
 const novel = allChapters[index++];
 running++;

 return this.processChapter(novel).then((result) => {
 if (result) totalEvent.push(result);
 running--;
 return runNext();
 });
 };

 // concurrency task
 const workers = Array.from({ length: Math.min(this.concurrency, allChapters.length) }, () => runNext());

 await Promise.all(workers);

 return totalEvent;
 }
}

export default CleanNovel;
