import type { ExtensionContext, AgentToolUpdateCallback, AgentToolResult } from "@earendil-works/pi-coding-agent";
import { ImageGenSchema, type ImageGenInput } from "./types.ts";
import { resolveProviderAuth, downloadOrDecodeImage, saveGeneratedImage, formatImageResult } from "./utils.ts";
import { callGenerateImageApi } from "./api.ts";
import { DEFAULT_RESOLUTION, resolveXaiImageModel } from "./payload.ts";

export { ImageGenSchema };

export async function imageGen(
    id: string,
    params: ImageGenInput,
    signal: AbortSignal,
    onUpdate: AgentToolUpdateCallback | undefined,
    ctx: ExtensionContext
): Promise<AgentToolResult<any>> {
    const auth = await resolveProviderAuth(ctx);
    if (!auth) {
        return {
            content: [{
                type: "text",
                text: "Error: No API key found for image generation. Please configure `xai` or `openai` in `~/.pi/agent/auth.json` or set `XAI_API_KEY` / `OPENAI_API_KEY` in environment variables."
            }],
            details: { error: "missing_auth" }
        };
    }

    onUpdate?.({
        content: [{
            type: "text",
            text: `Generating image with ${auth.provider.toUpperCase()} (${params.model || (auth.provider === "xai" ? resolveXaiImageModel() : "dall-e-3")})...`
        }],
        details: { status: "generating" }
    });

    try {
        const result = await callGenerateImageApi(auth, params, signal);
        if (!result.data || result.data.length === 0) {
            throw new Error("No image data received from API");
        }

        onUpdate?.({
            content: [{
                type: "text",
                text: `Saving ${result.data.length} generated image(s)...`
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
            resolution: params.resolution || (result.provider === "xai" ? DEFAULT_RESOLUTION : undefined),
            quality: params.quality,
            revisedPrompt: result.data[0]?.revised_prompt
        });
    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: `Image generation failed: ${error?.message || String(error)}`
            }],
            details: { error: error?.message || String(error) }
        };
    }
}
