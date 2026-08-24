import type { ExtensionContext, AgentToolResult } from "@earendil-works/pi-coding-agent";
import type { Api, Model } from "@earendil-works/pi-ai";
import { getEnvApiKey } from "@earendil-works/pi-ai/compat";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";

export interface ProviderAuth {
    provider: "xai" | "openai";
    apiKey: string;
    baseUrl?: string;
}

export function readAuthJson(): Record<string, any> {
    const authPath = join(homedir(), ".pi", "agent", "auth.json");
    try {
        if (existsSync(authPath)) {
            return JSON.parse(readFileSync(authPath, "utf8"));
        }
    } catch {
        // ignore read errors
    }
    return {};
}

export async function resolveProviderAuth(
    ctx: ExtensionContext,
    preferredProvider?: "xai" | "openai"
): Promise<ProviderAuth | undefined> {
    // 1. If currently active model is xAI or OpenAI, try to get its credentials
    if (ctx.model) {
        const modelProvider = ctx.model.provider?.toLowerCase() || "";
        const isXai = modelProvider === "xai" || ctx.model.baseUrl?.includes("api.x.ai");
        const isOpenai = modelProvider === "openai" || modelProvider === "openai-codex";

        if ((preferredProvider === "xai" || !preferredProvider) && isXai) {
            const auth = await ctx.modelRegistry.getApiKeyAndHeaders(ctx.model);
            if (auth.ok && auth.apiKey) {
                return { provider: "xai", apiKey: auth.apiKey, baseUrl: ctx.model.baseUrl };
            }
        }
        if ((preferredProvider === "openai" || !preferredProvider) && isOpenai) {
            const auth = await ctx.modelRegistry.getApiKeyAndHeaders(ctx.model);
            if (auth.ok && auth.apiKey) {
                return { provider: "openai", apiKey: auth.apiKey, baseUrl: ctx.model.baseUrl };
            }
        }
    }

    // 2. Check environment variables
    const envXai = process.env.XAI_API_KEY || getEnvApiKey("xai");
    if ((preferredProvider === "xai" || !preferredProvider) && envXai) {
        return { provider: "xai", apiKey: envXai };
    }

    const envOpenai = process.env.OPENAI_API_KEY || getEnvApiKey("openai");
    if ((preferredProvider === "openai" || !preferredProvider) && envOpenai) {
        return { provider: "openai", apiKey: envOpenai };
    }

    // 3. Check ~/.pi/agent/auth.json
    const authJson = readAuthJson();

    if (preferredProvider === "xai" || !preferredProvider) {
        const xaiEntry = authJson["xai"];
        if (xaiEntry) {
            const key = typeof xaiEntry === "string" ? xaiEntry : (xaiEntry.access || xaiEntry.apiKey || xaiEntry.token);
            if (key) return { provider: "xai", apiKey: key };
        }
    }

    if (preferredProvider === "openai" || !preferredProvider) {
        const openaiEntry = authJson["openai"] || authJson["openai-codex"];
        if (openaiEntry) {
            const key = typeof openaiEntry === "string" ? openaiEntry : (openaiEntry.access || openaiEntry.apiKey || openaiEntry.token);
            if (key) return { provider: "openai", apiKey: key };
        }
    }

    return undefined;
}

export function guessMimeType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    switch (ext) {
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".png":
            return "image/png";
        case ".webp":
            return "image/webp";
        case ".gif":
            return "image/gif";
        case ".svg":
            return "image/svg+xml";
        default:
            return "image/png";
    }
}

export function imageInputToDataUri(inputPathOrUrl: string): string {
    const trimmed = inputPathOrUrl.trim();
    if (trimmed.startsWith("data:") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
    }

    const absPath = isAbsolute(trimmed) ? trimmed : resolve(process.cwd(), trimmed);
    if (!existsSync(absPath)) {
        throw new Error(`Reference image not found: ${absPath}`);
    }

    const buffer = readFileSync(absPath);
    const mime = guessMimeType(absPath);
    return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function downloadOrDecodeImage(imageItem: { url?: string; b64_json?: string }): Promise<Buffer> {
    if (imageItem.b64_json) {
        return Buffer.from(imageItem.b64_json, "base64");
    }
    if (imageItem.url) {
        const res = await fetch(imageItem.url);
        if (!res.ok) {
            throw new Error(`Failed to download generated image from ${imageItem.url}: HTTP ${res.status} ${res.statusText}`);
        }
        const arrayBuf = await res.arrayBuffer();
        return Buffer.from(arrayBuf);
    }
    throw new Error("Generated image item contained neither URL nor b64_json");
}

export function detectImageExtension(buffer: Buffer): ".jpg" | ".png" | ".webp" {
    if (
        buffer.length >= 12
        && buffer.subarray(0, 4).toString("ascii") === "RIFF"
        && buffer.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
        return ".webp";
    }
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return ".jpg";
    }
    if (
        buffer.length >= 8
        && buffer[0] === 0x89
        && buffer[1] === 0x50
        && buffer[2] === 0x4e
        && buffer[3] === 0x47
    ) {
        return ".png";
    }
    return ".jpg";
}

function defaultImageFilename(buffer: Buffer, index: number): string {
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
    return `imagine_${dateStr}_${index + 1}${detectImageExtension(buffer)}`;
}

export async function saveGeneratedImage(
    buffer: Buffer,
    customOutputPath?: string,
    index = 0
): Promise<{ absolutePath: string; relativePath: string }> {
    const cwd = process.cwd();
    let targetPath: string;

    if (customOutputPath) {
        targetPath = isAbsolute(customOutputPath) ? customOutputPath : resolve(cwd, customOutputPath);
        if (targetPath.endsWith("/") || targetPath.endsWith("\\")) {
            targetPath = join(targetPath, defaultImageFilename(buffer, index));
        }
    } else {
        const dir = join(cwd, "generated_images");
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        targetPath = join(dir, defaultImageFilename(buffer, index));
    }

    const parentDir = dirname(targetPath);
    if (!existsSync(parentDir)) {
        mkdirSync(parentDir, { recursive: true });
    }

    writeFileSync(targetPath, buffer);

    // Compute relative path
    let relPath = targetPath;
    if (targetPath.startsWith(cwd)) {
        relPath = "." + targetPath.slice(cwd.length);
        if (!relPath.startsWith("./")) relPath = "./" + relPath.replace(/^\//, "");
    }

    return {
        absolutePath: targetPath,
        relativePath: relPath
    };
}

export function formatImageResult(
    files: Array<{ absolutePath: string; relativePath: string }>,
    metadata: {
        provider: string;
        model: string;
        prompt: string;
        aspectRatio?: string;
        resolution?: string;
        quality?: string;
        revisedPrompt?: string;
    }
): AgentToolResult<any> {
    const lines: string[] = [];
    lines.push(`### Image Generated Successfully`);
    lines.push(`- **Provider**: ${metadata.provider}`);
    lines.push(`- **Model**: ${metadata.model}`);
    if (metadata.aspectRatio) {
        lines.push(`- **Aspect Ratio**: ${metadata.aspectRatio}`);
    }
    if (metadata.resolution) {
        lines.push(`- **Resolution**: ${metadata.resolution}`);
    }
    if (metadata.quality) {
        lines.push(`- **Quality**: ${metadata.quality}`);
    }
    lines.push(`- **Prompt**: ${metadata.prompt}`);
    if (metadata.revisedPrompt) {
        lines.push(`- **Revised Prompt**: ${metadata.revisedPrompt}`);
    }
    lines.push(``);
    lines.push(`#### Output Files:`);
    for (const f of files) {
        lines.push(`- **Path**: \`${f.relativePath}\` (Absolute: \`${f.absolutePath}\`)`);
        lines.push(`  ![Generated Image](${f.absolutePath})`);
    }

    return {
        content: [{ type: "text", text: lines.join("\n") }],
        details: {
            files,
            metadata
        }
    };
}
