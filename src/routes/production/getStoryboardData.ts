import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
 "/",
 validateFields({
 scriptId: z.number(),
 }),
 async (req, res) => {
 const { scriptId } = req.body;
 const storyboardData = await u.db("o_storyboard").where({ scriptId }).orderBy("index", "asc");
 const data = await Promise.all(
 storyboardData.map(async (i) => {
 return {
 ...i,
 filePath: i.filePath ? await u.oss.getSmallImageUrl(i.filePath!) : "",
 };
 }),
 );

 //getrelatedAsset
 const storyboardIds = storyboardData.map((s) => s.id as number);

 // o_assets.id related o_assets2Storyboard.assetIdby storyboardId 
 const storyboardConfigs = await u
 .db("o_assets2Storyboard")
 .leftJoin("o_assets", "o_assets2Storyboard.assetId", "o_assets.id")
 .leftJoin("o_image", "o_assets.imageId", "o_image.id")
 .whereIn("o_assets2Storyboard.storyboardId", storyboardIds)
 .select("o_assets2Storyboard.storyboardId", "o_assets.id as assetId", "o_assets.name", "o_assets.type", "o_image.filePath as avatar");

 // by storyboardId characters list
 const storyboardCharactersMap = storyboardConfigs.reduce<Record<number, { name: string; type: string; avatar?: string }[]>>((acc, cur) => {
 const storyboardId = cur.storyboardId as number;
 if (!acc[storyboardId]) {
 acc[storyboardId] = [];
 }
 const character: { name: string; type: string; avatar?: string } = {
 name: cur.name ?? "",
 type: cur.type ?? "",
 };
 if (cur.avatar) {
 character.avatar = cur.avatar;
 }
 acc[storyboardId].push(character);
 return acc;
 }, {});

 // data Shot interface
 const result = await Promise.all(
 data.map(async (item) => {
 const characters = storyboardCharactersMap[item.id as number] ?? [];
 // handle characters of avatar OSS Path
 const charactersWithUrl = await Promise.all(
 characters.map(async (c) => {
 if (c.avatar) {
 return { ...c, avatar: await u.oss.getSmallImageUrl(c.avatar) };
 }
 return c;
 }),
 );
 return {
 id: String(item.id),
 createTime: item.createTime ?? undefined,
 duration: item.duration ? Number(item.duration) : undefined,
 filePath: item.filePath || undefined,
 prompt: item.prompt ?? undefined,
 scriptId: item.scriptId ?? undefined,
 characters: charactersWithUrl,
 };
 }),
 );
 res.status(200).send(success(result));
 },
);
