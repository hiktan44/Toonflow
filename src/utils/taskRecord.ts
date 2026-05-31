import db from "@/utils/db";

const taskStateMap = {
 "0": "In progress",
 "1": "Completed",
 "-1": "Generation failed",
};
/**
 * record task andreturnend function
 * @param projectId Project ID
 * @param taskClass taskCategory
 * @param modelName Model name
 * @param opts optionalrelatedtask
 */
export default async function taskRecord(
 projectId: number,
 taskClass: string,
 modelName: string,
 opts: {
 describe?: string;
 content?: any;
 } = {},
) {
 const { content, describe = "" } = opts;

 let opteorContent: string | undefined;
 if (content === undefined || content === null) {
 opteorContent = undefined;
 } else if (typeof content === "string") {
 opteorContent = content;
 } else if (typeof content === "function") {
 throw new Error("Not supportedofType");
 } else {
 try {
 opteorContent = JSON.stringify(content);
 } catch (e) {
 opteorContent = content.toString();
 }
 }

 const [id] = await db("o_tasks").insert({
 projectId,
 taskClass,
 relatedObjects: opteorContent,
 model: modelName,
 describe,
 state: taskStateMap[0],
 startTime: Date.now(),
 });

 /** taskSuccesswhen done(1)Failedwhen done(-1, 'reason') */
 return async function done(state: 1 | -1, reason?: string) {
 await db("o_tasks")
 .where("id", id)
 .update({
 state: taskStateMap[state],
 reason: state === -1 ? (reason ?? "") : null,
 });
 };
}
