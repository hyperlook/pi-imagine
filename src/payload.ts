import type { ImageEditInput, ImageGenInput } from "./types.ts";

/** 与 Grok Build 默认一致：质量档、1k、一次返回字节。 */
export const DEFAULT_XAI_IMAGE_MODEL = "grok-imagine-image-quality";
export const FAST_XAI_IMAGE_MODEL = "grok-imagine-image";
export const IMAGE_2_MODEL = "grok-imagine-image-2.0";
export const DEFAULT_RESOLUTION = "1k";
export const DEFAULT_ASPECT_RATIO = "auto";

export function resolveXaiImageModel(model?: string): string {
    const trimmed = model?.trim();
    return trimmed ? trimmed : DEFAULT_XAI_IMAGE_MODEL;
}

export function isImagineImage2(model: string): boolean {
    return model.includes("imagine-image-2");
}

export function buildXaiGenerateBody(params: ImageGenInput): Record<string, unknown> {
    const model = resolveXaiImageModel(params.model);
    const body: Record<string, unknown> = {
        model,
        prompt: params.prompt,
        n: params.n || 1,
        aspect_ratio: params.aspect_ratio || DEFAULT_ASPECT_RATIO,
        resolution: params.resolution || DEFAULT_RESOLUTION,
        response_format: "b64_json"
    };
    if (params.quality && isImagineImage2(model)) {
        body.quality = params.quality;
    }
    return body;
}

export function buildXaiEditBody(
    params: ImageEditInput,
    imagePayload: unknown
): Record<string, unknown> {
    const model = resolveXaiImageModel(params.model);
    const body: Record<string, unknown> = {
        model,
        prompt: params.prompt,
        image: imagePayload,
        resolution: params.resolution || DEFAULT_RESOLUTION,
        response_format: "b64_json"
    };
    if (params.aspect_ratio && params.aspect_ratio !== "auto") {
        body.aspect_ratio = params.aspect_ratio;
    }
    if (params.quality && isImagineImage2(model)) {
        body.quality = params.quality;
    }
    return body;
}
