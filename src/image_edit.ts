import type { ExtensionContext, AgentToolUpdateCallback, AgentToolResult } from "@earendil-works/pi-coding-agent";
import { ImageEditSchema, type ImageEditInput } from "./types.ts";
import { resolveProviderAuth, downloadOrDecodeImage, saveGeneratedImage, formatImageResult } from "./utils.ts";
import { callEditImageApi } from "./api.ts";
import { DEFAULT_RESOLUTION, resolveXaiImageModel } from "./payload.ts";

export { ImageEditSchema };

export async function imageEdit(
    id: string,
    params: ImageEditInput,
    signal: AbortSignal,
    onUpdate: AgentToolUpdateCallback | undefined,
    ctx: ExtensionContext
): Promise<AgentToolResult<any>> {
    const auth = await resolveProviderAuth(ctx, "xai");
    if (!auth) {
        return {
            content: [{
                type: "text",
                text: "Error: No xAI API key found for image editing. Please configure `xai` in `~/.pi/agent/auth.json` or set `XAI_API_KEY` in your environment."
            }],
            details: { error: "missing_xai_auth" }
        };
    }

    onUpdate?.({
        content: [{
            type: "text",
            text: `Editing image with xAI Grok Imagine (${resolveXaiImageModel(params.model)})...`
        }],
        details: { status: "editing" }
    });

    try {
        const result = await callEditImageApi(auth, params, signal);
        if (!result.data || result.data.length === 0) {
            throw new Error("No image data received from API");
        }

        onUpdate?.({
            content: [{
                type: "text",
                text: `Saving ${result.data.length} edited image(s)...`
            }],
            details: { status: "saving" }
        });

        const savedFiles: Array<{ absolutePath: string; relativePath: string }> = [];
        for (let i = 0; i < result.data.length; i++) {
            const item = result.data[i];
            const buffer = await downloadOrDecodeImage(item);
            const saved = await saveGeneratedImage(buffer, params.output_path, i);
            savedFiles.push(saved);
        }

        return formatImageResult(savedFiles, {
            provider: result.provider,
            model: result.model,
            prompt: params.prompt,
            aspectRatio: params.aspect_ratio,
            resolution: params.resolution || DEFAULT_RESOLUTION,
            quality: params.quality,
            revisedPrompt: result.data[0]?.revised_prompt
        });
    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: `Image edit failed: ${error?.message || String(error)}`
            }],
            details: { error: error?.message || String(error) }
        };
    }
}
