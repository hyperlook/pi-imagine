import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { imageGen, ImageGenSchema } from "./image_gen.ts";
import { imageEdit, ImageEditSchema } from "./image_edit.ts";
import { searchPromptCases, SearchPromptCasesSchema } from "./search_prompt_cases.ts";

export const IMAGE_GEN_TOOL = "image_gen";
export const IMAGE_EDIT_TOOL = "image_edit";
export const SEARCH_PROMPT_CASES_TOOL = "search_prompt_cases";

export default function (pi: ExtensionAPI) {
    pi.registerTool({
        name: SEARCH_PROMPT_CASES_TOOL,
        label: "Search Prompt Cases",
        description: "在 500+ 个经过实测的高质量提示词画廊中检索案例。支持关键词、分类（UI、海报、3D、电商、信息图、写实摄影等）、风格及场景过滤。返回带材质、光影、排版与变量插槽的完整黄金 Prompt。",
        parameters: SearchPromptCasesSchema,
        execute: searchPromptCases
    });

    pi.registerTool({
        name: IMAGE_GEN_TOOL,
        label: "Image Gen",
        description: "根据文本生成新图（Grok Imagine / DALL-E）。可指定比例、分辨率 1k|2k、2.0 的 quality，以及保存路径。未指定模型/分辨率时走 Grok Build 同款默认：grok-imagine-image-quality + 1k。",
        parameters: ImageGenSchema,
        execute: imageGen
    });

    pi.registerTool({
        name: IMAGE_EDIT_TOOL,
        label: "Image Edit",
        description: "用文本改已有图或参考图（Grok Imagine）。接受本地路径、URL 或 data URI。分辨率/模型规则与 image_gen 相同。",
        parameters: ImageEditSchema,
        execute: imageEdit
    });
}

