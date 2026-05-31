import { Knex } from "knex";
import { v4 as uuid } from "uuid";
import { getEmbedding } from "@/utils/agent/embedding";

interface TableSchema {
 name: string;
 builder: (table: Knex.CreateTableBuilder) => void;
 initData?: (knex: Knex) => Promise<void>;
}

export default async (knex: Knex, forceInit: boolean = false): Promise<void> => {
 const tables: TableSchema[] = [
 // table
 {
 name: "o_user",
 builder: (table) => {
 table.integer("id").notNullable();
 table.text("name");
 table.text("password");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 initData: async (knex) => {
 await knex("o_user").insert([{ id: 1, name: "admin", password: "admin123" }]);
 },
 },
 //Projecttable
 {
 name: "o_project",
 builder: (table) => {
 table.integer("id");
 table.string("projectType");
 table.string("imageModel");
 table.string("imageQuality");
 table.string("videoModel");
 table.text("name");
 table.text("intro");
 table.text("type");
 table.text("artStyle");
 table.text("directorManual");
 table.text("mode");
 table.text("videoRatio");
 table.integer("createTime");
 table.integer("userId");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 },
 //table
 {
 name: "o_artStyle",
 builder: (table) => {
 table.integer("id").notNullable();
 table.string("name");
 table.text("fileUrl");
 table.text("label");
 table.text("prompt");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 initData: async (knex) => {},
 },
 //AgentConfigurationtable
 {
 name: "o_agentDeploy",
 builder: (table) => {
 table.integer("id").notNullable();
 table.string("model");
 table.string("key");
 table.string("modelName");
 table.text("vendorId");
 table.string("desc");
 table.string("name");
 table.integer("temperature");
 table.integer("maxOutputTokens");
 table.boolean("disabled").defaultTo(false);
 table.primary(["id"]);
 table.unique(["id"]);
 },
 initData: async (knex) => {
 await knex("o_agentDeploy").insert([
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "scriptAgent",
 name: "ScriptAgent",
 desc: "readoriginal textadaptation strategyusetextandof",
 disabled: false,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "productionAgent",
 name: "Agent",
 desc: "streamanduseofandtaskof",
 disabled: false,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "universalAi",
 name: "AI",
 desc: "NovelEventextractAssetPromptextractusetexthandleof",
 disabled: false,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "ttsDubbing",
 name: "TTS",
 desc: "based onScriptcontentCharactersupportsand",
 disabled: true,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "scriptAgent:decisionAgent",
 name: "ScriptAgent:",
 desc: "",
 temperature: 1,
 maxOutputTokens: 0,
 disabled: false,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "scriptAgent:supervisionAgent",
 name: "ScriptAgent:",
 desc: "",
 temperature: 1,
 maxOutputTokens: 0,
 disabled: false,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "scriptAgent:storySkeletonAgent",
 name: "ScriptAgent:",
 desc: "",
 temperature: 1,
 maxOutputTokens: 0,
 disabled: false,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "scriptAgent:adaptationStrategyAgent",
 name: "ScriptAgent:adaptation strategy",
 desc: "adaptation strategy",
 temperature: 1,
 maxOutputTokens: 0,
 disabled: false,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "scriptAgent:scriptAgent",
 name: "ScriptAgent:Script",
 desc: "Script",
 temperature: 1,
 maxOutputTokens: 0,
 disabled: false,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "productionAgent:decisionAgent",
 name: "Agent:",
 desc: "",
 temperature: 1,
 maxOutputTokens: 0,
 disabled: false,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "productionAgent:supervisionAgent",
 name: "Agent:",
 desc: "",
 temperature: 1,
 maxOutputTokens: 0,
 disabled: false,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "productionAgent:deriveAssetsAgent",
 name: "Agent:derivedAsset",
 desc: "derivedAsset",
 temperature: 1,
 maxOutputTokens: 0,
 disabled: false,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "productionAgent:generateAssetsAgent",
 name: "Agent:Asset",
 desc: "Asset",
 temperature: 1,
 maxOutputTokens: 0,
 disabled: false,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "productionAgent:directorPlanAgent",
 name: "Agent:",
 desc: "",
 temperature: 1,
 maxOutputTokens: 0,
 disabled: false,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "productionAgent:storyboardGenAgent",
 name: "Agent:Storyboard",
 desc: "Storyboard",
 temperature: 1,
 maxOutputTokens: 0,
 disabled: false,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "productionAgent:storyboardPanelAgent",
 name: "Agent:Storyboard",
 desc: "Storyboard",
 temperature: 1,
 maxOutputTokens: 0,
 disabled: false,
 },
 {
 model: "",
 modelName: "",
 vendorId: null,
 key: "productionAgent:storyboardTableAgent",
 name: "Agent:Storyboardtable",
 desc: "Storyboardtable",
 temperature: 1,
 maxOutputTokens: 0,
 disabled: false,
 },
 ]);
 },
 },
 //Settingstable
 {
 name: "o_setting",
 builder: (table) => {
 table.text("key");
 table.text("value");
 table.primary(["key"]);
 table.unique(["key"]);
 },
 initData: async (knex) => {
 await knex("o_setting").insert([
 {
 key: "tokenKey",
 value: uuid().slice(0, 8),
 },
 {
 key: "messagesPerSummary",
 value: 10,
 },
 {
 key: "shortTermLimit",
 value: 5,
 },
 {
 key: "summaryMaxLength",
 value: 500,
 },
 {
 key: "summaryLimit",
 value: 10,
 },
 {
 key: "ragLimit",
 value: 3,
 },
 {
 key: "deepRetrieveSummaryLimit",
 value: 5,
 },
 {
 key: "modelopennxFile",
 value: '["all-MiniLM-L6-v2", "onnx", "model_fp16.onnx"]',
 },
 {
 key: "modelDtype",
 value: "fp16",
 },
 {
 key: "switchAiDevTool",
 value: "0",
 },
 ]);
 },
 },
 //tasktable
 {
 name: "o_tasks",
 builder: (table) => {
 table.integer("id").notNullable();
 table.integer("projectId");
 table.string("taskClass");
 table.string("relatedObjects");
 table.string("model");
 table.text("describe");
 table.string("state");
 table.integer("startTime");
 table.text("reason");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 initData: async (knex) => {},
 },
 //Prompttable
 {
 name: "o_prompt",
 builder: (table) => {
 table.integer("id").notNullable();
 table.string("name");
 table.string("type");
 table.text("data");
 table.text("useData");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 initData: async (knex) => {
 await knex("o_prompt").insert([
 {
 name: "Eventextract",
 type: "eventExtraction",
 data: `# Eventextract\n\nyouwhetherveltextchapteroforiginal textyouextractchapterofEventInformation\n\n## ⚠️ itemsFailed\n\n1. youof**** \`|\` open \`|\` 7 field\n2. of**chapter**is \`|\`****is \`|\`\n3. \`|\` no characters allowed before——"based on……""the followingis……"\n4. \`|\` not——extract\n5. nottableMarkdown emojimark\n\n## \n\n\`\`\`\n| chapterXchapter {chapter} | {Character} | {Event} | {related} | {Information} | {} | {emotion intensity} |\n\`\`\`\n\n### field\n\n| field | | example |\n|------|----------|------|\n| chapter | \`chapterXchapter {chapter}\` | \`chapter1chapter \` |\n| Character | with actual scenesCharacterseparated by enumeration comma | \`\` |\n| Event | 30-60+result | \`System\` |\n| related | **** \`//3-8\` | \`+System\` |\n| Information | \`\` / \`\` / \`\` | \`\` |\n| | **** \`X\` | \`50\` |\n| emotion intensity | Tags\`+\` Connection/ | \`convert to+\` |\n\n**related**/related//\n\n****+high emotion→45-60→35-45→25-35\n\n**Tags**\`\`\`\`\`\`\`convert to\`\`\`\`\`\`\`\`\`\`\`\n\n## example\n\nthe followingexampleofis****——Othercontent\n\n\`\`\`\n| chapter1chapter | | ""System | +System | | 50 | convert to+ |\n\`\`\`\n\`\`\`\n| chapter12chapter | | atwhenrelatedand | | | 25 | + |\n\`\`\`\n\n## extract\n\n- original textnotnotnotoriginal textof\n- Characteruseconsistent\n- itemsEventwhenofitems\n- chapterrelatedresultnon-content`,
 },
 {
 name: "ScriptAssetextract",
 type: "scriptAssetExtraction",
 data: `---\nname: universal_agent\ndescription: ScriptcontentextractusedAssetCharacterScenePropAssetlistof\n---\n\n# Script Assets Extract\n\nyouisofScriptcontentScripttextandextractallofAssetCharacterScenePropAsset generationunderprocessusedDescriptionandPrompt\n\n## whenuse\n\nScriptcontent,youneedextractinvolved inallAssetCharacterScenePropofAssetlistofasset description AI imageandprocess\n\n## Systemofrelated\n\n- AssetType\n - \`role\` — Character \`o_assets.type = "role"\`\n - \`scene\` — Scene \`o_assets.type = "scene"\`\n - \`tool\` — Prop \`o_assets.type = "tool"\`\n- underAssetPrompt → AI Assetimage → Storyboard\n\n## \n\n** \`resultTool\` toolreturnresult**textMarkdown table JSON Assetlist\n\`resultTool\` of schema fieldTypeandvalidatewhenstrictly followunderfielddefinitionensuredatafieldTypematch\n\nAssetthe followingfield\n\n| field | Type | Required | |\n| ---- | ---- | ---- | ---- |\n| \`name\` | string | is | AssetNameuseScriptofstart,notOtherDescription |\n| \`desc\` | string | is | asset description30-80 ofDescription |\n| \`prompt\` | string | is | Generate prompt AI image |\n| \`type\` | enum | is | AssetType\`role\` / \`scene\` / \`tool\` |\n\n## extract\n\n### Characterrole\n\n- extractScriptofallofCharacter\n- \`desc\`\n- \`prompt\`PromptDescriptionCharacterof AI Characterimage\n- Characterwhenof \`name\`\n- no""""non-\n\n### Scenescene\n\n- extractScriptofallScene/\n- \`desc\`related\n- \`prompt\`PromptDescriptionSceneof AI Sceneimage\n- SceneofnotStatus/notextractat \`desc\` \n\n### Proptool\n\n- extractScriptofProp/\n- \`desc\`special\n- \`prompt\`PromptDescriptionPropof AI Propimage\n- extractofProp\n\n\n## Promptprompt\n\n- ofrelatedkeywords/\n- Description****\n- relatedkeywords anime style, manga style based onProject\n- Character prompt example\`a young man, sharp eyebrows, black hair, pale skin, wearing a gray Taoist robe, slender build, cold expression\`\n- Scene prompt example\`dark cave interior, glowing crystals on walls, misty atmosphere, dim blue lighting, stone altar in center\`\n- Prop prompt example\`ancient jade pendant, oval shape, translucent green, carved dragon pattern, glowing faintly\`\n\n## extractprocess\n\n1. ScriptallofCharacterSceneProp\n2. Asset generationof \`name\`\`desc\`\`prompt\`\`type\`\n3. Assetnotextract\n4. ** \`resultTool\` toolAssetlist**notconvert allAsset \`assetsList\` Submit\n\n## extract\n\n1. **Script**allextractScriptofcontent,notofAsset\n2. ****DescriptionandPrompt AI image\n3. ****extractofAssetextract\n4. **Category**by role/scene/tool Categorynot\n5. **Prompt**Prompt AI image\n\n## \n\n- Assetlist**notScriptcontent**extractuseofAsset\n- CharacterofPropextract\n- SceneofnotneedextractPropnon-`,
 },
 {
 name: "Video prompt",
 type: "videoPromptGeneration",
 data: `# Video prompt Skill\n\nyouis**Video prompt Agent**based onspecifiedof AI video modelreadStoryboardInformationofVideo prompt\n\n---\n\n## \n\n### 1. \n\n\n#### \n\n| items | match | |\n|------|----------|------|\n| \`Seedance2.0\` / \`seedance 2.0\` / \`2.0\` | **Seedance 2.0** | noMulti-reference |\n| \`Wan2.6\` / \`wan 2.6\` / \`2.6\` | **Wan 2.6** | Single imageFirst frame+ textnoLast frame |\n| Other + \`Multi-reference:is\` | **Multi-reference** | supportsCharacter/Scene/storyboard imageMulti-reference |\n| Other + \`Multi-reference:No\` | **First and last frames** | First frame/First and last frames + textDescription |\n\n> PromptmatchofSeedance 2.0 and Wan 2.6 isspecifiedOKof\n\n### 2. AssetInformation\n\n\`\`\`\nAssetInformation[id, type, name], [id, type, name], ...\n\`\`\`\n\n- \`id\`Asset \`A001\`\n- \`type\`AssetType \`character\`Character/ \`scene\`Scene/ \`prop\`Prop\n- \`name\`AssetName \`\`\`\`\`\`\n\n### 3. StoryboardInformation\n\nStoryboard \`<storyboardItem>\` XML TagslistofitemsStoryboardunder\n\n\`\`\`xml\n<storyboardItem\n videoDesc='Visual descriptionScenerelatedAssetNamewhenCharacterrelatedAssetID'\n prompt=''\n track=''\n duration='Time'\n associateAssetsIds="[StoryboardofAssetIDlist]"\n shouldGenerateImage="true"\n></storyboardItem>\n\`\`\`\n\n#### field\n\n| | | |\n|------|------|------|\n| \`videoDesc\` | ****StoryboardofVisual descriptionVisual descriptionScenerelatedAssetNamewhenCharacterrelatedAssetID | /System |\n| \`prompt\` | **alreadyfield**ofstoryboard imagePromptunder**notedit** | Systemalready |\n| \`track\` | Storyboard | /System |\n| \`duration\` | when | /System |\n| \`associateAssetsIds\` | StoryboardrelatedofAssetIDlist | /System |\n| \`shouldGenerateImage\` | whetherneedGenerate storyboardimageDefault \`true\` | /System |\n\n---\n\n## task\n\nreadall \`<storyboardItem>\` ofAssetInformationbased onspecifiedofPromptAllStoryboardofVideo prompt\n\n---\n\n## \n\nconvert allStoryboard**ofVideo prompt**non-items\n\n| | |\n|------|----------|\n| **Multi-reference** | \`[References]\` all \`@imageN \` \`[Instruction]\` byTimeDescription |\n| **First and last frames** | textVisual / Motion / Camera / Audio / Narrativenotuse \`@imageN \` byTime\`[Motion]\` 0s → when 1 not |\n| **Seedance 2.0** | \`the following N Storyboardof\`items \`StoryboardN<duration-ms>\` |\n| **Wan 2.6** | Single imageFirst frameitemsStoryboardPrompt → +Scene+ → notuse \`@imageN \` |\n\n- Video prompttextnot XML Tagsnot\n\n---\n\n## videoDesc parse\n\n \`videoDesc\` byseparated by enumeration commaextractthe followingfield\n\n\`\`\`\n{Visual description}{Scene}{relatedAssetName}{when}{}{}{Character}{}{}{}{}{relatedAssetID}\n\`\`\`\n\n| | field | | example |\n|------|------|------|------|\n| 1 | Visual description | prompt of | |\n| 2 | Scene | matchSceneAsset | |\n| 3 | relatedAssetName | matchCharacter/PropAsset | / |\n| 4 | when | when | 4s |\n| 5 | | | |\n| 6 | | | |\n| 7 | Character | prompt | |\n| 8 | | prompt | |\n| 9 | | prompt | |\n| 10 | | prompt /audio | no / content |\n| 11 | | prompt | |\n| 12 | relatedAssetID | AssetID↔CharacterTagsmapping | A001/A002 |\n\n---\n\n## Asset\n\nalluse \`@imageN \` Assetandstoryboard imageby\n\n1. **Asset**byAssetInformation \`[id, type, name]\` of \`@image1 \` openstartnot character / scene / prop\n2. **storyboard image**items \`<storyboardItem>\` storyboard imageAsset\n3. **nostoryboard imageofitems** \`shouldGenerateImage="false"\` whenStoryboardnot generatedimage**not**storyboard image\n\n#### example\n\n 3 Asset + 2 itemsStoryboard\n\`\`\`\nAssetInformation[A001, character, ], [A002, character, ], [A003, scene, ]\n\`\`\`\n\`\`\`xml\n<storyboardItem ...> <!-- Storyboard1 -->\n<storyboardItem ...> <!-- Storyboard2 -->\n\`\`\`\n\nresult\n\n| | Tags | |\n|--------|----------|------|\n| [A001, character, ] | \`@image1 \` | Character· image |\n| [A002, character, ] | \`@image2 \` | Character· image |\n| [A003, scene, ] | \`@image3 \` | Scene· image |\n| storyboardItem chapter1items | \`@image4 \` | storyboard image1 |\n| storyboardItem chapter2items | \`@image5 \` | storyboard image2 |\n\n---\n\n## Prompt\n\n### Multi-reference\n\n#### \n- MVL + imageat\n- storyboard image/Time/imageSceneimageconsistent\n- allAssetandstoryboard image \`@imageN \` \n- ** videoDesc**Promptcontent videoDesc ofVisual descriptionwhenCharacterfieldnotcontent\n- **not**videoDesc ofStoryboardat Instruction relatedDescription\n- **Type**plaindialogueinner monologue OSvoiceover VOat Instruction \n\n#### prompt template\n\n\`\`\`\n[References]\n@image1 : [{CharacterA}image]\n@image2 : [{CharacterB}image]\n@image3 : [{Scene}image]\n@image4 : [storyboard image1]\n\n[Instruction]\nBased on the storyboard @image4 :\n@image1 {/StatusDescription},\n@image2 {/StatusDescription},\nset in the {SceneDescription} of @image3 ,\n{/Description},\n{},\n{Description dialogue/OS/VO / No dialogue},\n{Description}.\n\`\`\`\n\n#### \n1. **Instruction **\n2. ** videoDesc**Promptcontent videoDesc ofVisual descriptionwhenCharacterfieldnotInformation\n3. **Character** videoDesc ofCharacterfieldextractDescription\n4. **not**videoDesc ofStoryboardat Instruction contentstartnot\n5. **Type**plain \`(dialogue)\` \`(inner monologue, OS)\` \`(voiceover, VO)\`\n6. ****useTags\`cinematic\` / \`wide-angle\` / \`close-up\` / \`slow motion\` / \`surround shooting\` / \`handheld\`\n7. **related**use\`wearing\` / \`holding\` / \`standing on\` / \`following behind\` / \`sitting in\`\n8. itemsStoryboard \`@imageN \`notDescription\n9. noDescriptionCharacterimage\n10. nowhen\n11. **nostoryboard imagewhen** \`shouldGenerateImage="false"\` whenStoryboardnostoryboard image\`[References]\` notstoryboard image\`[Instruction]\` notuse \`@imageN \` storyboard imagetextDescriptioncontent\n\n#### KlingOmni example\n\n\n\`\`\`\nKlingOmni\nAssetInformation[A001, character, ], [A002, character, ], [A003, scene, ]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='/4snoA001/A003' prompt='...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n<storyboardItem videoDesc='//4snoA001/A002/A003' prompt='of...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n\n\`\`\`\n[References]\n@image1 : [image]\n@image2 : [image]\n@image3 : [image]\n@image4 : [storyboard image1]\n@image5 : [storyboard image2]\n\n[Instruction]\nBased on the storyboard from @image4 to @image5 :\n@image1 standing alone atop the city wall, hands clasped behind back, robes billowing in the wind, gazing across the vast land,\n@image2 ascending the steps toward @image1 , expression worried,\nset in the ancient city wall environment of @image3 ,\nwide shot transitioning to medium tracking shot, cinematic,\nresolute determination shifting to concerned anticipation, dusk cold-toned side-backlit atmosphere fading,\nno dialogue,\nwind howling, fabric flapping, footsteps on stone.\n\`\`\`\n\n---\n\n### First and last frames\n\n#### \n- **textPrompt**Prompt**notuse \`@imageN \` **notCharacterAssetSceneAssetnotstoryboard imageAllcontenttextDescription\n- ****Visual / Motion / Camera / Audio / Narrative\n- ** videoDesc**Promptcontent videoDesc ofVisual descriptionwhenCharacterfieldnotcontent\n- **not**videoDesc ofStoryboardat \`[Audio]\` content\n- **Type**plaindialogue, lip-sync activeinner monologue OS, silent lipsvoiceover VO, silent lipsat \`[Audio]\` \n- **notof \`silent\`** — \n- ****notexists\n- **Time** 1 \`0s-Xs\` \n\n#### prompt template\n\n\`\`\`\n[Visual]\n{A}: {}, {/}, {Status speaking/silent}.\n{B}: {}, {/}, {Status}.\n{SceneDescription}, {PropDescription}.\n{Tags}.\n\n[Motion]\n0s-{X}s: {A} {Description1}.\n{X}s-{Y}s: {B} {Description2}.\n\n[Camera]\n{Type}, {}, {Description}.\n\n[Audio]\n{Xs-Ys}: "{content}" — {} ({dialogue / inner monologue OS / voiceover VO}), {lip-sync active / silent lips}.\n{Description}.\n\n[Narrative]\n{}, {}.\n\`\`\`\n\n#### \n1. **All**\n2. **notuse \`@imageN \` **PromptnotCharacterAssetSceneAssetstoryboard imageAllcontenttextDescription\n3. **Description**at [Visual] Descriptionrelated\n4. ** videoDesc**Promptcontent videoDesc ofVisual descriptionwhenCharacterfieldnotInformation\n5. **Status**\`speaking\` / \`silent\` / \`speaking simultaneously\`\n6. **not**videoDesc ofStoryboardat \`[Audio]\` contentstartnot\n7. **Type**plain \`dialogue, lip-sync active\` \`inner monologue (OS), silent lips\` \`voiceover (VO), silent lips\`\n8. **Motion Time** 1 notwhen\n9. ****Camera Descriptionofnot\n10. **** Assistant ofcontent\n11. **Type**the following\`Wide establishing shot / Over-the-shoulder / Medium shot / Close-up / Wide shot / POV / Dutch angle / Crane up / Dolly right / Whip pan / Handheld / Slow motion\`\n\n#### Seedance 1.5 Pro example\n\n\n\`\`\`\nSeedance1.5\nAssetInformation[A001, character, ], [A002, character, ], [A003, scene, ]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='/4snoA001/A003' prompt='...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n<storyboardItem videoDesc='//4snoA001/A002/A003' prompt='of...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n\n\`\`\`\n[Visual]\nShen Ci: male, dark flowing robes, hair tied up, standing alone atop city wall, hands clasped behind back, robes billowing, silent.\nSu Jin: female, light-colored dress, hair partially down, ascending steps toward Shen Ci, expression worried, silent.\nAncient city wall, vast open land beyond, dusk sky fading.\nCinematic, photorealistic, 4K, high contrast, desaturated tones, shallow depth of field.\n\n[Motion]\n0s-4s: Shen Ci stands still on city wall edge, robes flutter in wind, hair sways gently. Gaze fixed on distant horizon.\n4s-8s: Su Jin climbs the last few steps onto the wall, walks toward Shen Ci. Shen Ci remains still, unaware. Su Jin slows as she approaches.\n\n[Camera]\nWide establishing shot, static for first 4 seconds capturing the lone figure. Then smooth transition to medium tracking shot following the woman ascending steps, single continuous take throughout, no cuts.\n\n[Audio]\n0s-4s: Wind howling across wall, fabric flapping rhythmically. No dialogue.\n4s-8s: Footsteps on stone, robes rustling. No dialogue.\nShen Ci — silent. Su Jin — silent.\n\n[Narrative]\nLone figure on city wall, then arrival of a companion. Tension between determination and concern. Single continuous take.\n\`\`\`\n\n---\n\n### Seedance 2.0\n\n#### \n- **12** \`@imageN \` Assetandstoryboard imagewhen \`<duration-ms>\`\n- **9Description**whenRequired\n- **when**Storyboardwhen 1000ms1 \n- **Prompt**\n- ** videoDesc**itemsStoryboardofDescriptioncontent videoDesc ofVisual descriptionwhenCharacterfieldnotcontent\n- **not**videoDesc ofStoryboardandDescription\n- **Type**plainuseuseOSuseVOmatchofStatusDescription\n\n#### prompt template\n\n**Storyboardtemplate**\n\`\`\`\nandType: {}, {}, {Type}\n\nthe following 1 Storyboardof:\n\nScene:\nStoryboard: no\n\nStoryboard1<duration-ms>{}</duration-ms>: Time{///}Sceneimage@image{Scene} {}{}{}@image{Character} {/table//Description}{Description}{}{}{}\n\`\`\`\n\n**Storyboardtemplate**\n\`\`\`\nandType: {}, {}, {Type}\n\nthe following {N} Storyboardof:\n\nScene:\nStoryboard: {Description}\n\nStoryboard1<duration-ms>{}</duration-ms>: Time{...}Sceneimage@image{Scene} {...}@image{Character} {...}{...}\nStoryboard2<duration-ms>{}</duration-ms>: ...\n...\n\`\`\`\n\n#### whenRequired\n\n\`@image{Character} {content}{9Description}\`\n\n9by\n\`\`\`\n{}{}{}{}{}{}{}{}{special}\n\`\`\`\n\n> desc Informationwhenbased onCharacterTypethe followingtable\n\n| CharacterType | Default |\n|------------|---------|\n| /Character | |\n| /Character | and |\n| /plainCharacter | |\n| /Character | and |\n| /Character | |\n\n#### noStoryboardhandle\n- not \`\` and\n- atDescription \`no\`\n\n#### Type\n\n| Type | | Description |\n|----------|------|----------|\n| plain | \`@image{Character} {}{9}\` | Characteropen |\n| | \`@image{Character} OS{}{9}\` | Characternot |\n| | \`@image{Character} VO{}{9}\` | CharacternotCharacternot in |\n\n#### \n1. **Prompt**\n2. ** videoDesc**itemsStoryboardcontent videoDesc ofVisual descriptionwhenCharacterfieldnotInformation\n3. **not**videoDesc ofStoryboardand\n4. **Type**plainOSVO\n5. **Storyboardwhen 1000ms1 **\n6. **when** videoDesc of × 1000 convert to \`<duration-ms>\`\n\n#### Seedance 2.0 example\n\n\n\`\`\`\nSeedance2.0\nAssetInformation[A001, character, ], [A002, character, ], [A003, scene, ]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='/4snoA001/A003' prompt='...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n<storyboardItem videoDesc='//4syouatA001/A002/A003' prompt='of...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n\n\`\`\`\nandType: , , , \n\nthe following 2 Storyboardof:\n\nScene:\nStoryboard: convert to\n\nStoryboard1<duration-ms>4000</duration-ms>: TimeSceneimage@image3 @image1 nois\n\nStoryboard2<duration-ms>4000</duration-ms>: TimeSceneimage@image3 @image2 of@image1 @image1 @image2 You're here alone again.and\n\`\`\`\n\n---\n\n### Wan 2.6\n\n#### \n- **Single imageFirst frame**First and last framesFirst framestoryboard imagenoLast frame\n- **itemsStoryboard/**items \`<storyboardItem>\` relatedAssetInformationofPrompt\n- **Prompt**NovelnotuseTagsnot \`4K, cinematic, high quality\` \n- **** → + Scene + → \n- **textPrompt**Prompt**notuse \`@imageN \` **AllcontenttextDescription\n- ** videoDesc**Promptcontent videoDesc ofVisual descriptionwhenCharacterfieldnotcontent\n- **not**videoDesc ofStoryboardatPromptrelatedDescription\n- **Type**plaindialogueinner monologue OSvoiceover VOatPrompt\n\n#### prompt template\n\nitemsStoryboardPromptnounder\n\n\`\`\`\n{},\n{} {}, {/Description}, {/table}.\n{Scene}, {}, {}, {Time/}.\n{/} {Description}, {}.\n{Description dialogue/OS/VO / No dialogue}.\n{Description}.\n{}, {}, {}, {}.\n\`\`\`\n\n#### \n\n| | | example |\n|------|------|------|\n| | | \`A cinematic epic scene\` / \`A melancholic cinematic scene\` |\n| + | Description | \`A young man in dark flowing robes stands alone atop the city wall, hands clasped behind back\` |\n| | not | ❌ \`He is sad.\` → ✅ \`head drops slowly, shoulders slumped\` |\n| | not | ❌ \`The sky is blue. The grass is green.\` → ✅ \`hazy blue sky stretches over the emerald valley\` |\n| | +++ | \`Warm golden hour light streams from behind, casting long shadows across the stone floor\` |\n| | | \`Captured in a wide establishing shot from a low-angle perspective, static camera\` |\n| Tags | not \`4K, cinematic, high quality\` | \`cinematic\` |\n\n#### \n1. **All**\n2. **notuse \`@imageN \` **PromptnotCharacterAssetSceneAssetstoryboard imageAllcontenttextDescription\n3. ****NovelbuildTagsandConfiguration\n4. **Description**DescriptionrelatedDescription\n5. ** videoDesc**Promptcontent videoDesc ofVisual descriptionwhenCharacterfieldnotInformation\n6. **not**videoDesc ofStoryboardatPromptcontentstartnot\n7. **Type**plain \`(dialogue)\` \`(inner monologue, OS)\` \`(voiceover, VO)\`\n8. **items/**handleitemsStoryboardPromptno\n9. **nowhen**whenPromptnotwhen\n10. **Description**notTagschildDescription\n11. **** Assistant ofcontent\n\n#### Wan 2.6 example\n\n**example1noStoryboard**\n\n\n\`\`\`\nWan2.6\nAssetInformation[A001, character, ], [A003, scene, ]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='/4snoA001/A003' prompt='...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n\n\`\`\`\nA cinematic epic scene with a cold, desaturated palette,\nA lone man in dark flowing robes stands atop an ancient city wall, hands clasped behind his back, robes and hair billowing in the wind, gaze fixed on the vast land stretching to the horizon, jaw set firm, eyes unwavering.\nThe weathered stone battlements frame the endless expanse below, rolling terrain fading into haze beneath a heavy dusk sky, clouds layered in muted golds and slate greys.\nCold side-backlight from the setting sun carves a sharp silhouette, long shadows stretching across the stone floor, a faint warm rim outlining the figure against the cool atmosphere.\nNo dialogue.\nWind howling across the open wall, fabric flapping rhythmically.\nCaptured in a wide establishing shot from a slightly low angle, static camera, single continuous take.\n\`\`\`\n\n**example2Storyboard**\n\n\n\`\`\`\nWan2.6\nAssetInformation[A001, character, ], [A002, character, ], [A003, scene, ]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='//4syouatA001/A002/A003' prompt='of...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n\n\`\`\`\nA melancholic cinematic scene, dusk tones deepening,\nA young woman in a light-colored dress ascends the final stone steps onto the city wall, her gaze locked on the lone figure ahead, brow slightly furrowed, pace slowing as she approaches, lips parting softly.\nThe ancient city wall stretches behind her, weathered stairs leading up from below, the distant skyline dimming as the last traces of golden hour fade into twilight.\nFading warm light mingles with rising cool blue tones, the contrast between the two figures softened by the diffused remnants of sunset.\n"You're here alone again." — Su Jin (dialogue).\nFootsteps on stone, wind sweeping across the battlements, fabric rustling.\nA medium tracking shot follows the woman from behind as she ascends and approaches, handheld camera with subtle movement, single continuous take.\n\`\`\`\n\n---\n\n## → Tagsmapping\n\n| videoDesc of | KlingOmniTags | Seedance 1.5Tags | Seedance 2.0Description | Wan 2.6 |\n|------|------|------|------|------|\n| | extreme wide shot | Extreme wide shot | | an extreme wide shot capturing the vast expanse |\n| | wide shot | Wide establishing shot | | a wide establishing shot |\n| | medium shot | Medium shot | | a medium shot |\n| | close-up | Close-up | | a close-up shot |\n| | close-up | Close-up | | a close-up capturing fine detail |\n| | extreme close-up | Extreme close-up | | an extreme close-up |\n\n## → Tagsmapping\n\n| videoDesc of | KlingOmniTags | Seedance 1.5Tags | Seedance 2.0Description | Wan 2.6 |\n|------|------|------|------|------|\n| | static camera | Static, no camera movement | | static camera, locked off |\n| | dolly in / push in | Slow dolly forward | | camera slowly pushing in |\n| | dolly out / pull back | Slow dolly backward pull | | camera gently pulling back |\n| | tracking shot | Tracking shot, handheld | | tracking shot following the subject |\n| | pan left/right | Slow pan | | smooth pan across the scene |\n| | whip pan | Whip pan | | whip pan |\n| | crane up/down | Crane up/down | | crane rising / descending |\n| | surround shooting | Orbiting shot | | orbiting around the subject |\n\n---\n\n## process\n\n1. **parse**extractandMulti-referencebymatchExtract assetslist\n2. **build @imageN table**Assetby \`@image1 \` storyboard image\`shouldGenerateImage="false"\` ofStoryboardnotstoryboard image\n3. **itemsparse \`<storyboardItem>\`**by videoDesc parseextract12field \`duration\`\`associateAssetsIds\` Tagsmapping\n4. **ofVideo prompt**byAllStoryboard\n5. **Video prompt**\n\n---\n\n## \n\n- **Video prompt**notVideo prompttext\n- ** videoDesc**Promptcontent videoDesc ofVisual descriptionwhenCharacterfieldnotcontent\n- **not**videoDesc ofStoryboardatPromptcontent,not\n- **start**content videoDesc ofstart\n- **Type**plaindialogue / OS / OSVO / VOatPrompt\n- **Time 1 **allTimeMotion Time / duration-msof 1 1000ms 0.5 1 of\n- ****relatedDescription Assistant ofcontent,not in Skill definition\n- **bymatchof**notnotof\n- **noteditstart**not \`<storyboardItem>\` offield\`prompt\` alreadyofstoryboard imagePrompt\n- **notAsset**useofAssetInformationnono/ \`No dialogue\`\n- **whenconvert to**Seedance 2.0 of \`<duration-ms>\` × 1000 convert to\n`,
 },
 {
 name: "",
 type: "audioBindPrompt",
 data: `youismatch\nyouoftaskisbased onCharacterAssetofNameDescriptionaudiolistof\nmatch\n1. based onCharacterDescriptionmatch\n2. Charactermatch\n3. listofnoreturn audioId`,
 },
 ]);
 },
 },
 //Prompttable
 {
 name: "o_modelPrompt",
 builder: (table) => {
 table.integer("id").notNullable();
 table.string("vendorId");
 table.string("model");
 table.text("fileName");
 table.text("path");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 initData: async (knex) => {},
 },
 //Noveloriginal texttable
 {
 name: "o_novel",
 builder: (table) => {
 table.integer("id").notNullable();
 table.integer("chapterIndex");
 table.text("reel");
 table.text("chapter");
 table.text("chapterData");
 table.integer("projectId");
 table.integer("eventState");
 table.text("event");
 table.text("errorReason");
 table.integer("createTime");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 },
 //NovelEventtable
 {
 name: "o_event",
 builder: (table) => {
 table.integer("id").notNullable();
 table.string("name");
 table.string("detail");
 table.integer("createTime");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 },
 //Event-chaptertable
 {
 name: "o_eventChapter",
 builder: (table) => {
 table.integer("id").notNullable();
 table.integer("eventId").unsigned().references("id").inTable("o_event");
 table.integer("novelId").unsigned().references("id").inTable("o_novel");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 },
 //Script
 {
 name: "o_script",
 builder: (table) => {
 table.integer("id").notNullable();
 table.text("name");
 table.text("content");
 table.integer("projectId");
 table.integer("extractState");
 table.integer("createTime");
 table.text("errorReason");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 },
 //Assettable
 {
 name: "o_assets",
 builder: (table) => {
 table.integer("id").notNullable();
 table.text("name");
 table.text("prompt");
 table.text("remark");
 table.text("type");
 table.text("describe");
 table.integer("scriptId"); //Scriptid
 table.integer("imageId").unsigned().references("id").inTable("o_image");
 table.integer("assetsId");
 table.integer("projectId");
 table.integer("flowId"); //streamid
 table.integer("startTime");
 table.string("promptState");
 table.integer("audioBindState");
 table.text("promptErrorReason");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 initData: async (knex) => {},
 },
 //imagetable
 {
 name: "o_image",
 builder: (table) => {
 table.integer("id").notNullable();
 table.text("filePath");
 table.text("type");
 table.integer("assetsId");
 table.text("model");
 table.text("resolution");
 table.text("state");
 table.text("errorReason");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 },
 //Storyboard
 {
 name: "o_storyboard",
 builder: (table) => {
 table.integer("id").notNullable();
 table.integer("scriptId");
 table.text("prompt");
 table.text("filePath");
 table.text("duration");
 table.text("state");
 table.integer("trackId");
 table.text("reason");
 table.text("track");
 table.text("videoDesc");
 table.integer("shouldGenerateImage"); // 0 No 1 is
 table.integer("projectId");
 table.integer("flowId"); //streamid
 table.integer("index");
 table.integer("createTime");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 },
 //flowData-Script
 {
 name: "o_agentWorkData",
 builder: (table) => {
 table.integer("id").notNullable();
 table.integer("projectId");
 table.integer("episodesId");
 table.string("key"); //Other
 table.string("data");
 table.integer("createTime");
 table.integer("updateTime");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 },
 //
 {
 name: "o_video",
 builder: (table) => {
 table.integer("id").notNullable();
 table.text("filePath");
 table.text("errorReason");
 table.integer("time");
 table.text("state");
 table.integer("scriptId");
 table.integer("projectId");
 table.integer("videoTrackId");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 },
 // video track
 {
 name: "o_videoTrack",
 builder: (table) => {
 table.integer("id").notNullable();
 table.integer("videoId");
 table.integer("projectId");
 table.integer("scriptId");
 table.text("state");
 table.text("reason");
 table.text("prompt");
 table.integer("selectVideoId");
 table.integer("duration");
 table.primary(["id"]);
 table.unique(["id"]);
 },
 },
 //Vendor configurationtable
 {
 name: "o_vendorConfig",
 builder: (table) => {
 table.string("id").notNullable();
 table.text("inputValues"); // JSON
 table.text("models"); // model configuration JSON
 table.integer("enable"); //whetherEnableVendor
 table.primary(["id"]);
 table.unique(["id"]);
 },
 initData: async (knex) => {
 await knex("o_vendorConfig").insert([
 {
 id: "toonflow",
 inputValues: "{}",
 models: "[]",
 enable: 0,
 },
 {
 id: "deepseek",
 inputValues: "{}",
 models: "[]",
 enable: 0,
 },
 {
 id: "atlascloud",
 inputValues: "{}",
 models: "[]",
 enable: 0,
 },
 {
 id: "volcengine",
 inputValues: "{}",
 models: "[]",
 enable: 0,
 },
 {
 id: "minimax",
 inputValues: "{}",
 models: "[]",
 enable: 0,
 },
 {
 id: "openai",
 inputValues: "{}",
 models: "[]",
 enable: 0,
 },
 {
 id: "klingai",
 inputValues: "{}",
 models: "[]",
 enable: 0,
 },
 {
 id: "vidu",
 inputValues: "{}",
 models: "[]",
 enable: 0,
 },
 ]);
 },
 },
 //imagestreamtable
 {
 name: "o_imageFlow",
 builder: (table) => {
 table.integer("id").notNullable();
 table.text("flowData").notNullable();
 table.primary(["id"]);
 table.unique(["id"]);
 },
 },
 {
 name: "o_assets2Storyboard",
 builder: (table) => {
 table.integer("storyboardId").notNullable();
 table.integer("assetId").notNullable();
 table.primary(["storyboardId", "assetId"]);
 table.unique(["storyboardId", "assetId"]);
 },
 },
 {
 name: "o_scriptAssets",
 builder: (table) => {
 table.integer("scriptId").notNullable();
 table.integer("assetId").notNullable();
 table.primary(["scriptId", "assetId"]);
 table.unique(["scriptId", "assetId"]);
 },
 },
 {
 name: "o_skillList",
 builder: (table) => {
 table.text("id").notNullable();
 table.text("md5").notNullable();
 table.text("path").notNullable();
 table.text("name").notNullable(); //filename
 table.text("description").notNullable(); //Description
 table.text("embedding"); // JSON
 table.text("type").notNullable(); // "main" | "references"
 table.integer("createTime").notNullable();
 table.integer("updateTime").notNullable();
 table.integer("state").notNullable(); // 1Normal0Generatingdescription-1description-2,-3md5-4File not found
 table.primary(["id"]);
 },
 initData: async (knex) => {
 const list = [
 {
 id: "4fb36012e56e395b425569987f5dab0e",
 md5: "fca3c269c5f325a65dafa663c9bb9773",
 path: "production_agent_decision.md",
 name: "production_agent_decision",
 description: "",
 embedding: "",
 type: "main",
 createTime: 1774447310118,
 updateTime: 1774447310118,
 state: -1,
 },
 {
 id: "017b6338d7aa227cd614ec1fb25fd83e",
 md5: "2610b80abe4bd048fe61c73adc7388ac",
 path: "production_agent_execution.md",
 name: "production_agent_execution",
 description: "",
 embedding: "",
 type: "main",
 createTime: 1774447310118,
 updateTime: 1774447310118,
 state: -1,
 },
 {
 id: "f03c8e67b61580de9ea5b9d166521b67",
 md5: "d41d8cd98f00b204e9800998ecf8427e",
 path: "production_agent_supervision.md",
 name: "production_agent_supervision",
 description: "",
 embedding: "",
 type: "main",
 createTime: 1774447310118,
 updateTime: 1774447310118,
 state: -1,
 },
 {
 id: "50b49d8af5d364665b463c23f6a4d8bb",
 md5: "fbba66e0df2426996277b299710c3033",
 path: "script_agent_decision.md",
 name: "script_agent_decision",
 description: "",
 embedding: "",
 type: "main",
 createTime: 1774447310118,
 updateTime: 1774447310118,
 state: -1,
 },
 {
 id: "427727727e1095c54b6840cd21382d82",
 md5: "7e5911242af7233854d533278c6a8ccb",
 path: "script_agent_execution.md",
 name: "script_agent_execution",
 description: "",
 embedding: "",
 type: "main",
 createTime: 1774447310118,
 updateTime: 1774447310118,
 state: -1,
 },
 {
 id: "02848fb0dd582fd926502c77ecf9679c",
 md5: "7a8b6a311b015cd47bf17cc52b935348",
 path: "script_agent_supervision.md",
 name: "script_agent_supervision",
 description: "",
 embedding: "",
 type: "main",
 createTime: 1774447310118,
 updateTime: 1774447310118,
 state: -1,
 },
 {
 id: "a1e818cc03a0b355b239ac1fb0512969",
 md5: "1fd22029e8047aa30b0dfd703cb837ed",
 path: "universal_agent.md",
 name: "universal_agent",
 description: "",
 embedding: "",
 type: "main",
 createTime: 1774447310118,
 updateTime: 1774447310118,
 state: -1,
 },
 {
 id: "3e5efec258c8d8e6a39bcef12f8ee058",
 md5: "efccb0464cfd472861b49ebf737d4820",
 path: "references/event_extract.md",
 name: "event_extract",
 description:
 "NoveloftextchapterextractCharacterEventrelatedInformationemotion intensityInformationMarkdowntableofcontentwhen",
 embedding: "",
 type: "references",
 createTime: 1774447310118,
 updateTime: 1774450165911,
 state: 1,
 },
 {
 id: "52c51fa8655f899a1b7aae9b6aad7251",
 md5: "783678aaab829b34e7c30a414c356bf6",
 path: "references/novel_character_extract.md",
 name: "novel_character_extract",
 description:
 "NovelcontentofCharacterextractoriginal textallCharacterofDescriptionInformationStatusfieldandAICharacterimageuse",
 embedding: "",
 type: "references",
 createTime: 1774447310118,
 updateTime: 1774450080903,
 state: 1,
 },
 {
 id: "6d46cdca10b2f49e07e515885d1387a0",
 md5: "10544d12c4ef011e6b3b63a99b8c7fa8",
 path: "references/novel_props_extract.md",
 name: "novel_props_extract",
 description:
 "Noveloriginal textExtract propsInformationofPropStatusofDescriptiontableandAIimageuse",
 embedding: "",
 type: "references",
 createTime: 1774447310118,
 updateTime: 1774450094771,
 state: 1,
 },
 {
 id: "1864df75d1d65f76e275046649ecaef8",
 md5: "65603aa495a541f54c55b7f30e149f45",
 path: "references/novel_scene_extract.md",
 name: "novel_scene_extract",
 description:
 "Noveloriginal textextractSceneInformationofSceneDescriptionrelatedfieldofSceneAssettableandAIimageofSceneimage",
 embedding: "",
 type: "references",
 createTime: 1774447310118,
 updateTime: 1774450161878,
 state: 1,
 },
 {
 id: "7fbce6f90d7d85496ba9817e9622e640",
 md5: "830559e8f2cd5d0fa8e6df48a164fe2d",
 path: "references/video_dialogue_extract.md",
 name: "video_dialogue_extract",
 description:
 "isStoryboardPromptextractInformationofAIConfigurationdefinitionofCharacterTypetablefieldextracthandleprocessStoryboardDescriptionconvert totable",
 embedding: "",
 type: "references",
 createTime: 1774447310118,
 updateTime: 1774450180712,
 state: 1,
 },
 {
 id: "31fb5c5a1f514ec1e66b4eba9f22d4db",
 md5: "43e63450efe0c9af8a3a40b036d36cb4",
 path: "references/pipeline.md",
 name: "pipeline",
 description:
 "ProjectofstreamEventextractadaptation strategyScriptofprocessdefinitionofof",
 embedding: "",
 type: "references",
 createTime: 1774451946248,
 updateTime: 1774451984533,
 state: 1,
 },
 {
 id: "27dc2dfc901de2180227d0269217583a",
 md5: "7d353be4bab7a794436d9abff2b9c6ee",
 path: "references/adaptation_format.md",
 name: "adaptation_format",
 description:
 "adaptation strategyofDeleteandofofof",
 embedding: "",
 type: "references",
 createTime: 1774452010535,
 updateTime: 1774452022083,
 state: 1,
 },
 {
 id: "d49fa09504fe784a8e6eb102756c6d56",
 md5: "2ef08a7479f29d74986999ceb02092c8",
 path: "references/event_format.md",
 name: "event_format",
 description:
 "ProjectEventtableoffileEventtablefieldchapterCharacterEventrelatedemotion intensitywhentemplateextractEventofchapter",
 embedding: "",
 type: "references",
 createTime: 1774452010535,
 updateTime: 1774452030858,
 state: 1,
 },
 {
 id: "797906c2ddf0750f050bcdeae23eae3d",
 md5: "f5e7fe6db7e05db69d5dc327c4c538f2",
 path: "references/script_format.md",
 name: "script_format",
 description:
 "ScriptofdefinitionfileStoryboardScriptVisual descriptionconvert towhenAIanduse",
 embedding: "",
 type: "references",
 createTime: 1774452010535,
 updateTime: 1774452042934,
 state: 1,
 },
 {
 id: "1abd8675c0c3e62b20c0b151d2ec0fb1",
 md5: "a587532c737ce15022e1522021f099bb",
 path: "references/skeleton_format.md",
 name: "skeleton_format",
 description:
 "definitionfileskeleton.mdoftemplatechapterEventlistconvert toof",
 embedding: "",
 type: "references",
 createTime: 1774452010535,
 updateTime: 1774452057184,
 state: 1,
 },
 {
 id: "0b7828d7a6ab458a4b201122f08d6c16",
 md5: "120b3c856f1b2a8a429e11319e8c95fe",
 path: "references/quality_criteria.md",
 name: "quality_criteria",
 description:
 "/ProjectofEventtableadaptation strategyandScriptofCharacterNamewhenSceneconsistentensureofcontent",
 embedding: "",
 type: "references",
 createTime: 1774452068093,
 updateTime: 1774452087877,
 state: 1,
 },
 {
 id: "5c1772b5f9c420d9eae9ca02914ba087",
 md5: "c710ab7d237e1f0c5aa3d208e0f5b484",
 path: "references/plan.md",
 name: "plan",
 description:
 "definitionAIoftasksteplistNamecontentrelatedandtemplatechildTool executionofstep",
 embedding: "",
 type: "references",
 createTime: 1774452098447,
 updateTime: 1774452109574,
 state: 1,
 },
 {
 id: "75a45cf996015ca819582873887ec301",
 md5: "6045d76873fd58b8b87a914a21a38439",
 path: "references/derive_assets_extraction.md",
 name: "derive_assets_extraction",
 description:
 "isbased onScriptcontentandalreadyAssetlistextractAssetatofnotStatusderivetoolreadanddataimage",
 embedding: "",
 type: "references",
 createTime: 1774452119499,
 updateTime: 1774452129516,
 state: 1,
 },
 {
 id: "fce75f69d704c19bebcb356bc1bd6e81",
 md5: "a3b3432854970f22949ba47236a6532f",
 path: "references/storyboard_generation.md",
 name: "storyboard_generation",
 description:
 "based onScriptandAssetlistStoryboardoftoolStoryboardsplitfieldTool callprocessScriptconvert toVisual descriptionandAIimagePromptofStoryboarddata",
 embedding: "",
 type: "references",
 createTime: 1774452119499,
 updateTime: 1774452140873,
 state: 1,
 },
 ];
 await Promise.all(
 list.map(async (item) => {
 const embedding = await getEmbedding(item.description);
 item.embedding = JSON.stringify(embedding);
 }),
 );
 await knex("o_skillList").insert(list);
 },
 },
 {
 name: "o_skillAttribution",
 builder: (table) => {
 table.text("skillId").notNullable().references("id").inTable("o_skillList").onDelete("CASCADE");
 table.text("attribution").notNullable(); // "production_agent_decision.md" | "production_agent_execution.md" | "production_agent_supervision.md" | "script_agent_decision.md" | "script_agent_execution.md" | "script_agent_supervision.md" | "universal_agent.md"
 table.primary(["skillId", "attribution"]);
 table.index(["attribution"]);
 },
 initData: async (knex) => {
 await knex("o_skillAttribution").insert([
 {
 skillId: "52c51fa8655f899a1b7aae9b6aad7251",
 attribution: "universal_agent.md",
 },
 {
 skillId: "6d46cdca10b2f49e07e515885d1387a0",
 attribution: "universal_agent.md",
 },
 {
 skillId: "1864df75d1d65f76e275046649ecaef8",
 attribution: "universal_agent.md",
 },
 {
 skillId: "3e5efec258c8d8e6a39bcef12f8ee058",
 attribution: "universal_agent.md",
 },
 {
 skillId: "7fbce6f90d7d85496ba9817e9622e640",
 attribution: "universal_agent.md",
 },
 {
 skillId: "31fb5c5a1f514ec1e66b4eba9f22d4db",
 attribution: "script_agent_decision.md",
 },
 {
 skillId: "27dc2dfc901de2180227d0269217583a",
 attribution: "script_agent_execution.md",
 },
 {
 skillId: "d49fa09504fe784a8e6eb102756c6d56",
 attribution: "script_agent_execution.md",
 },
 {
 skillId: "797906c2ddf0750f050bcdeae23eae3d",
 attribution: "script_agent_execution.md",
 },
 {
 skillId: "1abd8675c0c3e62b20c0b151d2ec0fb1",
 attribution: "script_agent_execution.md",
 },
 {
 skillId: "0b7828d7a6ab458a4b201122f08d6c16",
 attribution: "script_agent_supervision.md",
 },
 {
 skillId: "5c1772b5f9c420d9eae9ca02914ba087",
 attribution: "production_agent_decision.md",
 },
 {
 skillId: "75a45cf996015ca819582873887ec301",
 attribution: "production_agent_execution.md",
 },
 {
 skillId: "fce75f69d704c19bebcb356bc1bd6e81",
 attribution: "production_agent_execution.md",
 },
 ]);
 },
 },
 //tablemessage=startmessage, summary=summary
 {
 name: "memories",
 builder: (table) => {
 table.text("id").notNullable();
 table.text("isolationKey").notNullable(); //
 table.text("type").notNullable(); // 'message' | 'summary'
 table.text("role"); // 'user' | 'assistant'
 table.text("name");
 table.text("content").notNullable();
 table.text("embedding"); // JSON
 table.text("relatedMessageIds"); // summaryrelatedofmessage idlist JSON
 table.integer("summarized").defaultTo(0); // messagewhetheralready 0/1
 table.integer("createTime").notNullable();
 table.primary(["id"]);
 table.index(["isolationKey", "type"]);
 table.index(["isolationKey", "summarized"]);
 },
 },
 {
 name: "o_assetsRole2Audio",
 builder: (table) => {
 table.integer("assetsRoleId").notNullable();
 table.integer("assetsAudioId").notNullable();
 table.primary(["assetsAudioId", "assetsRoleId"]);
 table.unique(["assetsAudioId", "assetsRoleId"]);
 },
 },
 ];

 for (const t of tables) {
 const tableExists = await knex.schema.hasTable(t.name);
 if (!tableExists || forceInit) {
 if (tableExists && forceInit) {
 await knex.schema.dropTable(t.name);
 console.log("[Initializing database] alreadyexiststableDelete:", t.name);
 } else {
 console.log("[Initializing database] Creating table:", t.name);
 }
 await knex.schema.createTable(t.name, t.builder);
 if (t.initData) {
 await t.initData(knex);
 console.log("[Initializing database] Table data initialization:", t.name);
 }
 }
 }
};
