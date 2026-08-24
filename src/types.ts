import { Type, type Static } from "typebox";

export const AspectRatioEnum = Type.Union([
    Type.Literal("1:1"),
    Type.Literal("16:9"),
    Type.Literal("9:16"),
    Type.Literal("4:3"),
    Type.Literal("3:4"),
    Type.Literal("3:2"),
    Type.Literal("2:3"),
    Type.Literal("auto")
], { description: "画面比例。不传则 auto。头像/图标用 1:1，横幅/视频帧用 16:9，手机竖图用 9:16。" });

export const ResolutionEnum = Type.Union([
    Type.Literal("1k"),
    Type.Literal("2k")
], { description: "输出分辨率。默认 1k（快）。仅当用户明确要求高清、印刷、海报、大图时用 2k。" });

export const QualityEnum = Type.Union([
    Type.Literal("low"),
    Type.Literal("medium")
], { description: "仅 grok-imagine-image-2.0 有效。默认不传。要 2.0 画质时用 medium；要 2.0 但仍求快时用 low。" });

export const ImageGenSchema = Type.Object({
    prompt: Type.String({
        description: "完整画面描述：主体、动作、场景、风格、光影、构图、氛围。"
    }),
    aspect_ratio: Type.Optional(AspectRatioEnum),
    resolution: Type.Optional(ResolutionEnum),
    quality: Type.Optional(QualityEnum),
    output_path: Type.Optional(Type.String({
        description: "可选保存路径（如 ./output/cat.jpg）。省略则写到 ./generated_images/"
    })),
    model: Type.Optional(Type.String({
        description: "xAI 默认 grok-imagine-image-quality（与 Grok Build 一致，可省略）。要更快用 grok-imagine-image；要最高画质/锐利文字用 grok-imagine-image-2.0。OpenAI 默认 dall-e-3。未点名模型时不要覆盖默认。"
    })),
    n: Type.Optional(Type.Integer({
        description: "生成张数（默认 1，最大 4）",
        minimum: 1,
        maximum: 4
    }))
});

export type ImageGenInput = Static<typeof ImageGenSchema>;

export const ImageEditSchema = Type.Object({
    prompt: Type.String({
        description: "改图说明：写清要变什么、什么保持不变。"
    }),
    image: Type.Union([
        Type.String({ description: "参考图：本地路径、URL 或 data URI" }),
        Type.Array(Type.String(), { description: "多张参考图路径或 URL（最多 3 张）" })
    ], {
        description: "一张或多张参考图，本地路径、公开 URL 或 base64 data URI"
    }),
    aspect_ratio: Type.Optional(AspectRatioEnum),
    resolution: Type.Optional(ResolutionEnum),
    quality: Type.Optional(QualityEnum),
    output_path: Type.Optional(Type.String({
        description: "可选保存路径。省略则写到 ./generated_images/"
    })),
    model: Type.Optional(Type.String({
        description: "默认 grok-imagine-image-quality。未点名模型时不要覆盖。要最高画质用 grok-imagine-image-2.0。"
    }))
});

export type ImageEditInput = Static<typeof ImageEditSchema>;

export const SearchPromptCasesSchema = Type.Object({
    query: Type.Optional(Type.String({
        description: "搜索关键词（如：'水晶 海报', '微缩 广告', 'UI 仪表盘', '国风 水彩', '3D 盲盒' 等）"
    })),
    category: Type.Optional(Type.String({
        description: "按分类过滤，如：'UI & Interfaces', 'Charts & Infographics', 'Posters & Typography', 'Products & E-commerce', 'Characters & People', 'Illustration & Art', 'Photography & Realism', 'Architecture & Spaces', 'Scenes & Storytelling' 等"
    })),
    style: Type.Optional(Type.String({
        description: "按视觉风格过滤，如：'3D', 'Realistic', 'Poster', 'UI', 'Illustration', 'Infographic', 'Classical' 等"
    })),
    scene: Type.Optional(Type.String({
        description: "按应用场景过滤，如：'Commerce', 'Tech', 'Social', 'Story', 'Education', 'Fashion', 'Food', 'Travel' 等"
    })),
    limit: Type.Optional(Type.Integer({
        description: "返回候选案例条数（默认 3，最大 10）",
        minimum: 1,
        maximum: 10
    }))
});

export type SearchPromptCasesInput = Static<typeof SearchPromptCasesSchema>;

export interface PromptCaseItem {
    id: number;
    title: string;
    category: string;
    styles: string[];
    scenes: string[];
    prompt: string;
    image?: string;
}

export interface GeneratedImageItem {
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
    mime_type?: string;
}

export interface ImageApiResponse {
    data: GeneratedImageItem[];
    usage?: Record<string, any>;
    provider: string;
    model: string;
}
