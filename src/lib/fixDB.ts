import u from "@/utils";
import path from "path";
import fs from "fs";
import { Knex } from "knex";
import db from "@/utils/db";
import { transform } from "sucrase";
import rawVendorData from "./vendor.json";

const vendorData = rawVendorData as Record<string, string>;

export default async (knex: Knex): Promise<void> => {
 const addColumn = async (table: string, column: string, type: string) => {
 if (!(await knex.schema.hasTable(table))) return;
 if (!(await knex.schema.hasColumn(table, column))) {
 await knex.schema.alterTable(table, (t) => (t as any)[type](column));
 }
 };

 const dropColumn = async (table: string, column: string) => {
 if (!(await knex.schema.hasTable(table))) return;
 if (await knex.schema.hasColumn(table, column)) {
 await knex.schema.alterTable(table, (t) => t.dropColumn(column));
 }
 };

 const alterColumnType = async (table: string, column: string, type: string) => {
 if (!(await knex.schema.hasTable(table))) return;
 if (await knex.schema.hasColumn(table, column)) {
 await knex.schema.alterTable(table, (t) => {
 (t as any)[type](column).alter();
 });
 }
 };
 //AbnormalofStatusnotconsistent
 await db("o_novel").where("eventState", 0).update({
 eventState: -1,
 errorReason: "Failed",
 });
 await db("o_script").where("extractState", 0).update({
 extractState: -1,
 errorReason: "Failed",
 });
 await db("o_assets").where("promptState", "Generating").update({
 promptState: "Generation failed",
 promptErrorReason: "Failed",
 });
 await db("o_image").where("state", "Generating").update({
 state: "Generation failed",
 errorReason: "Failed",
 });
 await db("o_storyboard").where("state", "Generating").update({
 state: "Generation failed",
 reason: "Failed",
 });
 await db("o_video").where("state", "Generating").update({
 state: "Generation failed",
 errorReason: "Failed",
 });

 // Addfield
 await addColumn("o_prompt", "useData", "text");
 // Addfield
 await addColumn("o_agentDeploy", "type", "string");
 // Addfield
 await addColumn("o_agentDeploy", "temperature", "integer");
 // Addfield
 await addColumn("o_agentDeploy", "maxOutputTokens", "integer");
 await addColumn("o_assets", "audioBindState", "integer");
 await addColumn("o_modelPrompt", "fileName", "string");
 await addColumn("o_modelPrompt", "path", "string");
 const vendorDataSelect = await u.db("o_vendorConfig").whereIn("id", ["deepseek", "atlascloud"]).select("*");
 if (!vendorDataSelect.find((i) => i.id == "deepseek")) {
 await u.db("o_vendorConfig").insert({
 id: "deepseek",
 inputValues: "{}",
 models: "[]",
 enable: 0,
 });
 }
 if (!vendorDataSelect.find((i) => i.id == "atlascloud")) {
 await u.db("o_vendorConfig").insert({
 id: "atlascloud",
 inputValues: "{}",
 models: "[]",
 enable: 0,
 });
 }
 //whetheradd newPrompt
 const existAudioPrompt = await db("o_prompt").where("type", "audioBindPrompt").first();
 if (!existAudioPrompt)
 await db("o_prompt").insert({
 name: "",
 type: "audioBindPrompt",
 data: `youismatch\nyouoftaskisbased onCharacterAssetofNameDescriptionaudiolistof\nmatch\n1. based onCharacterDescriptionmatch\n2. Charactermatch\n3. listofnoreturn audioId`,
 });
 //o_settingwhetheragentUseMode
 const agentUserMode = await u.db("o_setting").where("key", "agentUseMode").first();
 if (!agentUserMode) {
 const allDeployData = await u
 .db("o_agentDeploy")
 .leftJoin("o_vendorConfig", "o_vendorConfig.id", "o_agentDeploy.vendorId")
 .select("o_agentDeploy.*");
 const advancedData = allDeployData.filter((item: any) => item.key?.includes(":"));
 const notValModelData = advancedData.filter((item) => !item.modelName);

 await u.db("o_setting").insert({
 key: "agentUseMode",
 value: notValModelData.length ? "0" : "1",
 });
 }
 //AdddataadvancedConfiguration
 const advancedAgentList = [
 { key: "scriptAgent:decisionAgent", name: "ScriptAgent:", desc: "" },
 { key: "scriptAgent:supervisionAgent", name: "ScriptAgent:", desc: "" },
 { key: "scriptAgent:storySkeletonAgent", name: "ScriptAgent:", desc: "" },
 { key: "scriptAgent:adaptationStrategyAgent", name: "ScriptAgent:adaptation strategy", desc: "adaptation strategy" },
 { key: "scriptAgent:scriptAgent", name: "ScriptAgent:Script", desc: "Script" },
 { key: "productionAgent:decisionAgent", name: "Agent:", desc: "" },
 { key: "productionAgent:supervisionAgent", name: "Agent:", desc: "" },
 { key: "productionAgent:deriveAssetsAgent", name: "Agent:derivedAsset", desc: "derivedAsset" },
 { key: "productionAgent:generateAssetsAgent", name: "Agent:Asset", desc: "Asset" },
 { key: "productionAgent:directorPlanAgent", name: "Agent:", desc: "" },
 { key: "productionAgent:storyboardGenAgent", name: "Agent:Storyboard", desc: "Storyboard" },
 { key: "productionAgent:storyboardPanelAgent", name: "Agent:Storyboard", desc: "Storyboard" },
 { key: "productionAgent:storyboardTableAgent", name: "Agent:Storyboardtable", desc: "Storyboardtable" },
 ];
 for (const agent of advancedAgentList) {
 const exists = await db("o_agentDeploy").where("key", agent.key).select("*").first();
 if (!exists) {
 await db("o_agentDeploy").insert({
 model: "",
 modelName: "",
 vendorId: null,
 key: agent.key,
 name: agent.name,
 desc: agent.desc,
 temperature: 1,
 maxOutputTokens: 0,
 disabled: false,
 });
 }
 }
 //Prompt
 await db("o_prompt").where("type", "scriptAssetExtraction").update({
 data: `---\nname: universal_agent\ndescription: ScriptcontentextractusedAssetCharacterScenePropAssetlistof\n---\n\n# Script Assets Extract\n\nyouisofScriptcontentScripttextandextractallofAssetCharacterScenePropAsset generationunderprocessusedDescriptionandPrompt\n\n## whenuse\n\nScriptcontent,youneedextractinvolved inallAssetCharacterScenePropofAssetlistofasset description AI imageandprocess\n\n## Systemofrelated\n\n- AssetType\n - \`role\` — Character \`o_assets.type = "role"\`\n - \`scene\` — Scene \`o_assets.type = "scene"\`\n - \`tool\` — Prop \`o_assets.type = "tool"\`\n- underAssetPrompt → AI Assetimage → Storyboard\n\n## \n\n** \`resultTool\` toolreturnresult**textMarkdown table JSON Assetlist\n\`resultTool\` of schema fieldTypeandvalidatewhenstrictly followunderfielddefinitionensuredatafieldTypematch\n\nAssetthe followingfield\n\n| field | Type | Required | |\n| ---- | ---- | ---- | ---- |\n| \`name\` | string | is | AssetNameuseScriptofstart,notOtherDescription |\n| \`desc\` | string | is | asset description30-80 ofDescription |\n| \`prompt\` | string | is | Generate prompt AI image |\n| \`type\` | enum | is | AssetType\`role\` / \`scene\` / \`tool\` |\n\n## extract\n\n### Characterrole\n\n- extractScriptofallofCharacter\n- \`desc\`atDescriptionopenCharacter"……""……"\n- \`prompt\`PromptDescriptionCharacterofopen \`a young man, ...\` \`a young woman, ...\` AI Characterimage\n- Characterwhenof \`name\`\n- no""""non-\n\n### Scenescene\n\n- extractScriptofallScene/\n- \`desc\`related\n- \`prompt\`PromptDescriptionSceneof AI Sceneimage\n- SceneofnotStatus/notextractat \`desc\` \n\n### Proptool\n\n- extractScriptofProp/\n- \`desc\`special\n- \`prompt\`PromptDescriptionPropof AI Propimage\n- extractofProp\n\n\n## Promptprompt\n\n- ofrelatedkeywords/\n- Description****\n- relatedkeywords anime style, manga style based onProject\n- Character prompt example\`a young man, sharp eyebrows, black hair, pale skin, wearing a gray Taoist robe, slender build, cold expression\`\n- Scene prompt example\`dark cave interior, glowing crystals on walls, misty atmosphere, dim blue lighting, stone altar in center\`\n- Prop prompt example\`ancient jade pendant, oval shape, translucent green, carved dragon pattern, glowing faintly\`\n\n## extractprocess\n\n1. ScriptallofCharacterSceneProp\n2. Asset generationof \`name\`\`desc\`\`prompt\`\`type\`\n3. Assetnotextract\n4. ** \`resultTool\` toolAssetlist**notconvert allAsset \`assetsList\` Submit\n\n## extract\n\n1. **Script**allextractScriptofcontent,notofAsset\n2. ****DescriptionandPrompt AI image\n3. ****extractofAssetextract\n4. **Category**by role/scene/tool Categorynot\n5. **Prompt**Prompt AI image\n\n## \n\n- Assetlist**notScriptcontent**extractuseofAsset\n- CharacterofPropextract\n- SceneofnotneedextractPropnon-`,
 });
 await db("o_prompt").where("type", "videoPromptGeneration").update({
 data: `# Video prompt Skill\n\nyouis**Video prompt Agent**based onspecifiedof AI video modelreadStoryboardInformationofVideo prompt\n\n---\n\n## \n\n### 1. \n\n\n#### \n\n| items | match | |\n|------|----------|------|\n| \`seedance-2-0\` + \`Multi-reference:is\` / \`seedance 2.0\` + \`Multi-reference:is\` / \`2.0\` + \`Multi-reference:is\` | **seedance-2-0*notOtherVersionseedance-1-5/seedance-1-0 | supportsCharacter/Scene/storyboard imageMulti-reference |\n| \`Wan2.6\` / \`wan 2.6\` / \`2.6\` | **Wan 2.6** | Single imageFirst frame+ textnoLast frame |\n| Other + \`Multi-reference:is\` | **Multi-reference** | supportsCharacter/Scene/storyboard imageMulti-reference |\n| Other/seedance-1-5/seedance-1-0 + \`Multi-reference:No\` | **First and last frames** | First frame/First and last frames + textDescription |\n\n> PromptmatchofSeedance 2.0 and Wan 2.6 isspecifiedOKof\n\n### 2. AssetInformation\n\n\`\`\`\nAssetInformation[id, type, name], [id, type, name], ...\n\`\`\`\n\n- \`id\`Asset \`A001\`\n- \`type\`AssetType \`role\`Character/ \`scene\`Scene/ \`prop\`Prop\n- \`name\`AssetName \`\`\`\`\`\`\n\n### 3. StoryboardInformation\n\nStoryboard \`<storyboardItem>\` XML TagslistofitemsStoryboardunder\n\n\`\`\`xml\n<storyboardItem\n videoDesc='Visual descriptionScenerelatedAssetNamewhenCharacterrelatedAssetID'\n prompt=''\n track=''\n duration='Time'\n associateAssetsIds="[StoryboardofAssetIDlist]"\n shouldGenerateImage="true"\n></storyboardItem>\n\`\`\`\n\n#### field\n\n| | | |\n|------|------|------|\n| \`videoDesc\` | ****StoryboardofVisual descriptionVisual descriptionScenerelatedAssetNamewhenCharacterrelatedAssetID | /System |\n| \`prompt\` | **alreadyfield**ofstoryboard imagePromptunder**notedit** | Systemalready |\n| \`track\` | Storyboard | /System |\n| \`duration\` | when | /System |\n| \`associateAssetsIds\` | StoryboardrelatedofAssetIDlist | /System |\n| \`shouldGenerateImage\` | whetherneedGenerate storyboardimageDefault \`true\` | /System |\n\n---\n\n## task\n\nreadall \`<storyboardItem>\` ofAssetInformationbased onspecifiedofPromptAllStoryboardofVideo prompt\n\n---\n\n## \n\nconvert allStoryboard**ofVideo prompt**non-items\n\n| | |\n|------|----------|\n| **Multi-reference** | \`[References]\` all \`@imageN \` \`[Instruction]\` byTimeDescription |\n| **First and last frames** | textVisual / Motion / Camera / Audio / Narrativenotuse \`@imageN \` byTime\`[Motion]\` 0s → when 1 not |\n| **Seedance 2.0** | \`the following N Storyboardof\`items \`StoryboardN{N}s\` |\n| **Wan 2.6** | Single imageFirst frameitemsStoryboardPrompt → +Scene+ → notuse \`@imageN \` |\n\n- Video prompttextnot XML Tagsnot\n\n---\n\n## videoDesc parse\n\n \`videoDesc\` byseparated by enumeration commaextractthe followingfield\n\n\`\`\`\n{Visual description}{Scene}{relatedAssetName}{when}{}{}{Character}{}{}{}{}{relatedAssetID}\n\`\`\`\n\n| | field | | example |\n|------|------|------|------|\n| 1 | Visual description | prompt of | |\n| 2 | Scene | matchSceneAsset | |\n| 3 | relatedAssetName | matchCharacter/PropAsset | / |\n| 4 | when | when | 4s |\n| 5 | | | |\n| 6 | | | |\n| 7 | Character | prompt | |\n| 8 | | prompt | |\n| 9 | | prompt | |\n| 10 | | prompt /audio | no / content |\n| 11 | | prompt | |\n| 12 | relatedAssetID | AssetID↔CharacterTagsmapping | A001/A002 |\n\n---\n\n## Asset\n\nalluse \`@imageN \` Assetandstoryboard imageby\n\n1. **Asset**byAssetInformation \`[id, type, name]\` of \`@image1 \` openstartnot role / scene / prop**AssetTypeofnot**—— scene character prop atcharacter atbynotbyType\n2. **storyboard image**items \`<storyboardItem>\` storyboard imageAsset\n3. **nostoryboard imageofitems** \`shouldGenerateImage="false"\` whenStoryboardnot generatedimage**not**storyboard image\n\n#### example\n\n 3 Asset + 2 itemsStoryboard\n\`\`\`\nAssetInformation[A001, role, ], [A002, role, ], [A003, scene, ]\n\`\`\`\n\`\`\`xml\n<storyboardItem ...> <!-- Storyboard1 -->\n<storyboardItem ...> <!-- Storyboard2 -->\n\`\`\`\n\nresult\n\n| | Tags | |\n|--------|----------|------|\n| [A001, role, ] | \`@image1 \` | Character· image |\n| [A002, role, ] | \`@image2 \` | Character· image |\n| [A003, scene, ] | \`@image3 \` | Scene· image |\n| storyboardItem chapter1items | \`@image4 \` | storyboard image1 |\n| storyboardItem chapter2items | \`@image5 \` | storyboard image2 |\n\n**example**\n\n 3 AssetSceneat+ 2 itemsStoryboard\n\`\`\`\nAssetInformation[A003, scene, ], [A001, role, ], [A002, role, ]\n\`\`\`\n\`\`\`xml\n<storyboardItem ...> <!-- Storyboard1 -->\n<storyboardItem ...> <!-- Storyboard2 -->\n\`\`\`\n\nresult\n\n| | Tags | |\n|--------|----------|------|\n| [A003, scene, ] | \`@image1 \` | Scene· image |\n| [A001, role, ] | \`@image2 \` | Character· image |\n| [A002, role, ] | \`@image3 \` | Character· image |\n| storyboardItem chapter1items | \`@image4 \` | storyboard image1 |\n| storyboardItem chapter2items | \`@image5 \` | storyboard image2 |\n\n> **related** \`@image1 \` isScenenon-Character\`@image2 \` \`@image3 \` isCharacterGenerate promptwhenbased onAssetof \`type\` fieldOKnon-based onSizeType\n\n---\n\n## Prompt\n\n### Multi-reference\n\n#### \n- MVL + imageat\n- storyboard image/Time/imageSceneimageconsistent\n- allAssetandstoryboard image \`@imageN \` \n- ** videoDesc**Promptcontent videoDesc ofVisual descriptionwhenCharacterfieldnotcontent\n- **not**videoDesc ofStoryboardat Instruction relatedDescription\n- **Type**plaindialogueinner monologue OSvoiceover VOat Instruction \n\n#### prompt template\n\n> ****\`[References]\` of \`@imageN\` byAssetCharacter/Scene/Propatwhenbased onAssetof \`type\` fieldOKnotofType-related\n\n\`\`\`\n[References]\n@image{Asset1} : [{Asset1Name}image] ← is role/scene/prop ofType\n@image{Asset2} : [{Asset2Name}image]\n@image{Asset3} : [{Asset3Name}image]\n...\n@image{storyboard image} : [storyboard image1] ← storyboard imageAsset\n\n[Instruction]\nBased on the storyboard @image{storyboard image} :\n@image{CharacterAsset} {/StatusDescription},\nset in the {SceneDescription} of @image{SceneAsset} ,\n{/Description},\n{},\n{Description dialogue/OS/VO / No dialogue},\n{Description}.\n\`\`\`\n\n#### \n1. **Instruction **\n2. ** videoDesc**Promptcontent videoDesc ofVisual descriptionwhenCharacterfieldnotInformation\n3. **Character** videoDesc ofCharacterfieldextractDescription\n4. **not**videoDesc ofStoryboardat Instruction contentstartnot\n5. **Type**plain \`(dialogue)\` \`(inner monologue, OS)\` \`(voiceover, VO)\`\n6. ****useTags\`cinematic\` / \`wide-angle\` / \`close-up\` / \`slow motion\` / \`surround shooting\` / \`handheld\`\n7. **related**use\`wearing\` / \`holding\` / \`standing on\` / \`following behind\` / \`sitting in\`\n8. itemsStoryboard \`@imageN \`notDescription\n9. noDescriptionCharacterimage\n10. nowhen\n11. **nostoryboard imagewhen** \`shouldGenerateImage="false"\` whenStoryboardnostoryboard image\`[References]\` notstoryboard image\`[Instruction]\` notuse \`@imageN \` storyboard imagetextDescriptioncontent\n\n#### KlingOmni example\n\n\n\`\`\`\nKlingOmni\nAssetInformation[A001, role, ], [A002, role, ], [A003, scene, ]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='/4snoA001/A003' prompt='...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n<storyboardItem videoDesc='//4snoA001/A002/A003' prompt='of...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n\n\`\`\`\n[References]\n@image1 : [image]\n@image2 : [image]\n@image3 : [image]\n@image4 : [storyboard image1]\n@image5 : [storyboard image2]\n\n[Instruction]\nBased on the storyboard from @image4 to @image5 :\n@image1 standing alone atop the city wall, hands clasped behind back, robes billowing in the wind, gazing across the vast land,\n@image2 ascending the steps toward @image1 , expression worried,\nset in the ancient city wall environment of @image3 ,\nwide shot transitioning to medium tracking shot, cinematic,\nresolute determination shifting to concerned anticipation, dusk cold-toned side-backlit atmosphere fading,\nno dialogue,\nwind howling, fabric flapping, footsteps on stone.\n\`\`\`\n\n---\n\n### First and last frames\n\n#### \n- **textPrompt**Prompt**notuse \`@imageN \` **notCharacterAssetSceneAssetnotstoryboard imageAllcontenttextDescription\n- ****Visual / Motion / Camera / Audio / Narrative\n- ** videoDesc**Promptcontent videoDesc ofVisual descriptionwhenCharacterfieldnotcontent\n- **not**videoDesc ofStoryboardat \`[Audio]\` content\n- **Type**plaindialogue, lip-sync activeinner monologue OS, silent lipsvoiceover VO, silent lipsat \`[Audio]\` \n- **notof \`silent\`** — \n- ****notexists\n- **Time** 1 \`0s-Xs\` \n\n#### prompt template\n\n\`\`\`\n[Visual]\n{A}: {}, {/}, {Status speaking/silent}.\n{B}: {}, {/}, {Status}.\n{SceneDescription}, {PropDescription}.\n{Tags}.\n\n[Motion]\n0s-{X}s: {A} {Description1}.\n{X}s-{Y}s: {B} {Description2}.\n\n[Camera]\n{Type}, {}, {Description}.\n\n[Audio]\n{Xs-Ys}: "{content}" — {} ({dialogue / inner monologue OS / voiceover VO}), {lip-sync active / silent lips}.\n{Description}.\n\n[Narrative]\n{}, {}.\n\`\`\`\n\n#### \n1. **All**\n2. **notuse \`@imageN \` **PromptnotCharacterAssetSceneAssetstoryboard imageAllcontenttextDescription\n3. **Description**at [Visual] Descriptionrelated\n4. ** videoDesc**Promptcontent videoDesc ofVisual descriptionwhenCharacterfieldnotInformation\n5. **Status**\`speaking\` / \`silent\` / \`speaking simultaneously\`\n6. **not**videoDesc ofStoryboardat \`[Audio]\` contentstartnot\n7. **Type**plain \`dialogue, lip-sync active\` \`inner monologue (OS), silent lips\` \`voiceover (VO), silent lips\`\n8. **Motion Time** 1 notwhen\n9. ****Camera Descriptionofnot\n10. **** Assistant ofcontent\n11. **Type**the following\`Wide establishing shot / Over-the-shoulder / Medium shot / Close-up / Wide shot / POV / Dutch angle / Crane up / Dolly right / Whip pan / Handheld / Slow motion\`\n\n#### Seedance 1.5 Pro example\n\n\n\`\`\`\nSeedance1.5\nAssetInformation[A001, role, ], [A002, role, ], [A003, scene, ]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='/4snoA001/A003' prompt='...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n<storyboardItem videoDesc='//4snoA001/A002/A003' prompt='of...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n\n\`\`\`\n[Visual]\nShen Ci: male, dark flowing robes, hair tied up, standing alone atop city wall, hands clasped behind back, robes billowing, silent.\nSu Jin: female, light-colored dress, hair partially down, ascending steps toward Shen Ci, expression worried, silent.\nAncient city wall, vast open land beyond, dusk sky fading.\nCinematic, photorealistic, 4K, high contrast, desaturated tones, shallow depth of field.\n\n[Motion]\n0s-4s: Shen Ci stands still on city wall edge, robes flutter in wind, hair sways gently. Gaze fixed on distant horizon.\n4s-8s: Su Jin climbs the last few steps onto the wall, walks toward Shen Ci. Shen Ci remains still, unaware. Su Jin slows as she approaches.\n\n[Camera]\nWide establishing shot, static for first 4 seconds capturing the lone figure. Then smooth transition to medium tracking shot following the woman ascending steps, single continuous take throughout, no cuts.\n\n[Audio]\n0s-4s: Wind howling across wall, fabric flapping rhythmically. No dialogue.\n4s-8s: Footsteps on stone, robes rustling. No dialogue.\nShen Ci — silent. Su Jin — silent.\n\n[Narrative]\nLone figure on city wall, then arrival of a companion. Tension between determination and concern. Single continuous take.\n\`\`\`\n\n---\n\n### Seedance 2.0\n\n#### \n- **12** \`@imageN \` Assetandstoryboard imagewhen \`{N}s\`\n- **definitionimagemapping**“imagedefinition” \`@imageN : /Scene\`Storyboardusenot \`@imageN \`\n- **9Description**whenRequired\n- **when**Storyboardwhen 1s\n- **Prompt**\n- ** videoDesc**itemsStoryboardofDescriptioncontent videoDesc ofVisual descriptionwhenCharacterfieldnotcontent\n- **not**videoDesc ofStoryboardandDescription\n- **Type**plainuseuseOSuseVOmatchofStatusDescription\n\n#### prompt template\n\n> ****\`@image{}\` of“imagedefinition”Storyboard \`@image{}\`/Scene\n\n**Storyboardtemplate**\n\`\`\`\nandType: {}, {}, {Type}\n\nimagedefinition:\n@image1: {Asset1}{}\n@image2: {Asset2}{}\n@imageN: {AssetN}{}\n...\n\nthe following 1 Storyboardof:\n\nScene:\nStoryboard: no\n\nStoryboard1 {N}s: Time{///}Scene{Scene}{}{}{}{Character} {/table//Description}{Description}{}{}{}\n\`\`\`\n\n**Storyboardtemplate**\n\`\`\`\nandType: {}, {}, {Type}\n\nimagedefinition:\n@image1: {Asset1}{}\n@image2: {Asset2}{}\n@imageN: {AssetN}{}\n...\n\nthe following {N} Storyboardof:\n\nScene:\nStoryboard: {Description}\n\nStoryboard1 {N}s: Time{...}Scene{Scene}{...}{Character} {...}{...}\nStoryboard2{N}s: ...\n...\n\`\`\`\n\n#### whenRequired\n\n\`{Character} {content}{9Description}\`\n\n9by\n\`\`\`\n{}{}{}{}{}{}{}{}{special}\n\`\`\`\n\n> desc Informationwhenbased onCharacterTypethe followingtable\n\n| CharacterType | Default |\n|------------|---------|\n| /Character | |\n| /Character | and |\n| /plainCharacter | |\n| /Character | and |\n| /Character | |\n\n#### noStoryboardhandle\n- not \`\` and\n- atDescription \`no\`\n\n#### Type\n\n| Type | | Description |\n|----------|------|----------|\n| plain | \`{Character} {}{9}\` | Characteropen |\n| | \`{Character} OS{}{9}\` | Characternot |\n| | \`{Character} VO{}{9}\` | CharacternotCharacternot in |\n\n#### \n1. **Prompt**\n2. **Video prompt**stepmatchAssettablenon-Promptcontentchapteris \`andType:\`\n3. ** videoDesc**itemsStoryboardcontent videoDesc ofVisual descriptionwhenCharacterfieldnotInformation\n4. **not**videoDesc ofStoryboardand\n5. **Type**plainOSVO\n6. **imagedefinitionStoryboard**"imagedefinition" \`@imageN : Description\`\n7. **StoryboardDisable \`@imageN \`**useCharacter/Scenenot \`@image1/@image2\` \n8. **Storyboardwhen 1s**\n9. **when**use videoDesc offormat is \`{N}s\` \`4s\` 1s\n\n#### Seedance 2.0 example\n\n\n\`\`\`\nSeedance2.0\nAssetInformation[A001, role, ], [A002, role, ], [A003, scene, ]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='/4snoA001/A003' prompt='...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n<storyboardItem videoDesc='//4syouatA001/A002/A003' prompt='of...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n\n\`\`\`\nandType: , , , \n\ndefinition:\n@image1: of\n@image2: of\n@image3: Scene\n\nthe following 2 Storyboardof:\n\nScene:\nStoryboard: convert to\n\nStoryboard1 4s: TimeScenenois\n\nStoryboard2 4s: TimeSceneofYou're here alone again.and\n\`\`\`\n\n---\n\n### Wan 2.6\n\n#### \n- **Single imageFirst frame**First and last framesFirst framestoryboard imagenoLast frame\n- **itemsStoryboard/**items \`<storyboardItem>\` relatedAssetInformationofPrompt\n- **Prompt**NovelnotuseTagsnot \`4K, cinematic, high quality\` \n- **** → + Scene + → \n- **textPrompt**Prompt**notuse \`@imageN \` **AllcontenttextDescription\n- ** videoDesc**Promptcontent videoDesc ofVisual descriptionwhenCharacterfieldnotcontent\n- **not**videoDesc ofStoryboardatPromptrelatedDescription\n- **Type**plaindialogueinner monologue OSvoiceover VOatPrompt\n\n#### prompt template\n\nitemsStoryboardPromptnounder\n\n\`\`\`\n{},\n{} {}, {/Description}, {/table}.\n{Scene}, {}, {}, {Time/}.\n{/} {Description}, {}.\n{Description dialogue/OS/VO / No dialogue}.\n{Description}.\n{}, {}, {}, {}.\n\`\`\`\n\n#### \n\n| | | example |\n|------|------|------|\n| | | \`A cinematic epic scene\` / \`A melancholic cinematic scene\` |\n| + | Description | \`A young man in dark flowing robes stands alone atop the city wall, hands clasped behind back\` |\n| | not | ❌ \`He is sad.\` → ✅ \`head drops slowly, shoulders slumped\` |\n| | not | ❌ \`The sky is blue. The grass is green.\` → ✅ \`hazy blue sky stretches over the emerald valley\` |\n| | +++ | \`Warm golden hour light streams from behind, casting long shadows across the stone floor\` |\n| | | \`Captured in a wide establishing shot from a low-angle perspective, static camera\` |\n| Tags | not \`4K, cinematic, high quality\` | \`cinematic\` |\n\n#### \n1. **All**\n2. **notuse \`@imageN \` **PromptnotCharacterAssetSceneAssetstoryboard imageAllcontenttextDescription\n3. ****NovelbuildTagsandConfiguration\n4. **Description**DescriptionrelatedDescription\n5. ** videoDesc**Promptcontent videoDesc ofVisual descriptionwhenCharacterfieldnotInformation\n6. **not**videoDesc ofStoryboardatPromptcontentstartnot\n7. **Type**plain \`(dialogue)\` \`(inner monologue, OS)\` \`(voiceover, VO)\`\n8. **items/**handleitemsStoryboardPromptno\n9. **nowhen**whenPromptnotwhen\n10. **Description**notTagschildDescription\n11. **** Assistant ofcontent\n\n#### Wan 2.6 example\n\n**example1noStoryboard**\n\n\n\`\`\`\nWan2.6\nAssetInformation[A001, role, ], [A003, scene, ]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='/4snoA001/A003' prompt='...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n\n\`\`\`\nA cinematic epic scene with a cold, desaturn\`ated palette,\nA lone man in dark flowing robes stands atop an ancient city wall, hands clasped behind his back, robes and hair billowing in the wind, gaze fixed on the vast land stretching to the horizon, jaw set firm, eyes unwavering.\nThe weathered stone battlements frame the endless expanse below, rolling terrain fading into haze beneath a heavy dusk sky, clouds layered in muted golds and slate greys.\nCold side-backlight from the setting sun carves a sharp silhouette, long shadows stretching across the stone floor, a faint warm rim outlining the figure against the cool atmosphere.\nNo dialogue.\nWind howling across the open wall, fabric flapping rhythmically.\nCaptured in a wide establishing shot from a slightly low angle, static camera, single continuous take.\n\`\`\`\n\n**example2Storyboard**\n\n\n\`\`\`\nWan2.6\nAssetInformation[A001, role, ], [A002, role, ], [A003, scene, ]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='//4syouatA001/A002/A003' prompt='of...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n\n\`\`\`\nA melancholic cinematic scene, dusk tones deepening,\nA young woman in a light-colored dress ascends the final stone steps onto the city wall, her gaze locked on the lone figure ahead, brow slightly furrowed, pace slowing as she approaches, lips parting softly.\nThe ancient city wall stretches behind her, weathered stairs leading up from below, the distant skyline dimming as the last traces of golden hour fade into twilight.\nFading warm light mingles with rising cool blue tones, the contrast between the two figures softened by the diffused remnants of sunset.\n"You're here alone again." — Su Jin (dialogue).\nFootsteps on stone, wind sweeping across the battlements, fabric rustling.\nA medium tracking shot follows the woman from behind as she ascends and approaches, handheld camera with subtle movement, single continuous take.\n\`\`\`\n\n---\n\n## → Tagsmapping\n\n| videoDesc of | KlingOmniTags | Seedance 1.5Tags | Seedance 2.0Description | Wan 2.6 |\n|------|------|------|------|------|\n| | extreme wide shot | Extreme wide shot | | an extreme wide shot capturing the vast expanse |\n| | wide shot | Wide establishing shot | | a wide establishing shot |\n| | medium shot | Medium shot | | a medium shot |\n| | close-up | Close-up | | a close-up shot |\n| | close-up | Close-up | | a close-up capturing fine detail |\n| | extreme close-up | Extreme close-up | | an extreme close-up |\n\n## → Tagsmapping\n\n| videoDesc of | KlingOmniTags | Seedance 1.5Tags | Seedance 2.0Description | Wan 2.6 |\n|------|------|------|------|------|\n| | static camera | Static, no camera movement | | static camera, locked off |\n| | dolly in / push in | Slow dolly forward | | camera slowly pushing in |\n| | dolly out / pull back | Slow dolly backward pull | | camera gently pulling back |\n| | tracking shot | Tracking shot, handheld | | tracking shot following the subject |\n| | pan left/right | Slow pan | | smooth pan across the scene |\n| | whip pan | Whip pan | | whip pan |\n| | crane up/down | Crane up/down | | crane rising / descending |\n| | surround shooting | Orbiting shot | | orbiting around the subject |\n\n---\n\n## process\n\n1. **parse**extractandMulti-referencebymatchExtract assetslist\n2. **build @imageN table**Assetby \`@image1 \` storyboard image\`shouldGenerateImage="false"\` ofStoryboardnotstoryboard image\n3. **itemsparse \`<storyboardItem>\`**by videoDesc parseextract12field \`duration\`\`associateAssetsIds\` Tagsmapping\n4. **ofVideo prompt**byAllStoryboard\n5. **Video prompt**\n\n---\n\n## \n\n- **Video prompt**notstepmatchAssettable\`---\`Video prompttextatPromptnon-Promptcontent\n- ** videoDesc**Promptcontent videoDesc ofVisual descriptionwhenCharacterfieldnotcontent\n- **not**videoDesc ofStoryboardatPromptcontent,not\n- **start**content videoDesc ofstart\n- **Type**plaindialogue / OS / OSVO / VOatPrompt\n- **Time 1 **allTimeMotion Time / Seedance 2.0 Storyboardwhen {N}sof 1 1s 0.5 1 of\n- ****relatedDescription Assistant ofcontent,not in Skill definition\n- **bymatchof**notnotof\n- **noteditstart**not \`<storyboardItem>\` offield\`prompt\` alreadyofstoryboard imagePrompt\n- **notAsset**useofAssetInformationnono/ \`No dialogue\`\n- **when**Seedance 2.0 ofStoryboardwhenuseformat is \`{N}s\` \`4s\` 1s\n`,
 });

 //Vendor
 const data = await knex("o_vendorConfig").select("*");
 for (const item of data) {
 let { id, code } = item;
 const filename = `${id}.ts`;
 const rootDir = u.getPath("vendor");
 if (!code && fs.existsSync(path.join(rootDir, filename))) continue;
 if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir, { recursive: true });
 if (!fs.existsSync(path.join(rootDir, filename))) {
 code = vendorData[filename] || code;
 code = code ?? "";
 fs.writeFileSync(path.join(rootDir, filename), code);
 }
 }
 const defList = Object.keys(vendorData).map((filename) => filename.replace(/\.ts$/, ""));
 const existingIds = data.map((i: any) => i.id);
 for (const id of defList) {
 if (!existingIds.includes(id)) {
 const tsCode = vendorData[`${id}.ts`];
 if (tsCode) await tempopensert(tsCode);
 }
 }

 await dropColumn("o_vendorConfig", "author");
 await dropColumn("o_vendorConfig", "description");
 await dropColumn("o_vendorConfig", "name");
 await dropColumn("o_vendorConfig", "icon");
 await dropColumn("o_vendorConfig", "inputs");
 await dropColumn("o_vendorConfig", "createTime");

 const volcengineVer = await u.vendor.getVendor("volcengine").version;
 if (Number(volcengineVer) < 2.3) {
 u.vendor.writeCode("volcengine", vendorData["volcengine.ts"]);
 }
 const minimaxVer = await u.vendor.getVendor("minimax").version;
 if (Number(minimaxVer) < 2.1) {
 u.vendor.writeCode("minimax", vendorData["minimax.ts"]);
 }
};

async function tempopensert(tsCode: string) {
 const jsCode = transform(tsCode, { transforms: ["typescript"] }).code;
 const exports = u.vm(jsCode);
 const vendor = exports.vendor;
 const data = await u.db("o_vendorConfig").where("id", vendor.id).first();
 if (data) return;
 await u.db("o_vendorConfig").insert({
 id: vendor.id,
 inputValues: JSON.stringify(vendor.inputValues ?? {}),
 models: JSON.stringify([]),
 enable: vendor.id == "toonflow" ? 1 : 0,
 });
 u.vendor.writeCode(vendor.id, tsCode);
}
