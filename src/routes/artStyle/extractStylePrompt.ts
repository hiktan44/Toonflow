import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
 "/",
 validateFields({
 images: z.array(z.string()),
 }),
 async (req, res) => {
 const { images } = req.body;
 try {
 const resText = await u.Ai.Text("universalAi").invoke({
 system:
 'based on the followingimagedataextractimageofart stylePromptimagewhenspecified,needart stylePromptnotneedOthercontent"`(art style2D,2d animation style)`,`(art style,photorealistic, lifelike, ultra detailed)``(art style3D,Chinese 3D animation style)`,imagenodescription methodreturn`nodescription method`,imagewhenofart stylePromptallimageofbyexampleof`art style`useandofart styleDescriptionneedofPrompt',
 messages: [
 {
 role: "user",
 content: [
 ...images.map((image: string) => ({
 type: "image" as const,
 image,
 })),
 ],
 },
 ],
 });
 res.status(200).send(success(resText.text));
 } catch (e) {
 const err = u.error(e);
 res.status(500).send({ message: err.message });
 }
 },
);
