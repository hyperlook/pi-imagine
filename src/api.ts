import type { ImageApiResponse, ImageGenInput, ImageEditInput } from "./types.ts";
import type { ProviderAuth } from "./utils.ts";
import { imageInputToDataUri } from "./utils.ts";
import { buildXaiEditBody, buildXaiGenerateBody } from "./payload.ts";

export async function callGenerateImageApi(
    auth: ProviderAuth,
    params: ImageGenInput,
    signal?: AbortSignal
): Promise<ImageApiResponse> {
    if (auth.provider === "xai") {
        const baseUrl = (auth.baseUrl || "https://api.x.ai/v1").replace(/\/+$/, "");
        const requestBody = buildXaiGenerateBody(params);
        const model = String(requestBody.model);

        const response = await fetch(`${baseUrl}/images/generations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${auth.apiKey}`
            },
            body: JSON.stringify(requestBody),
            signal
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`xAI Image Generation error (${response.status}): ${errText}`);
        }

        const json = await response.json();
        return {
            data: json.data || [],
            usage: json.usage,
            provider: "xai",
            model
        };
    } else {
        // OpenAI DALL-E
        const baseUrl = (auth.baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
        const model = params.model || "dall-e-3";

        // Map aspect ratio to OpenAI size
        let size = "1024x1024";
        if (params.aspect_ratio === "16:9") size = "1792x1024";
        else if (params.aspect_ratio === "9:16") size = "1024x1792";

        const requestBody: Record<string, any> = {
            model,
            prompt: params.prompt,
            n: model === "dall-e-3" ? 1 : (params.n || 1),
            size
        };

        const response = await fetch(`${baseUrl}/images/generations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${auth.apiKey}`
            },
            body: JSON.stringify(requestBody),
            signal
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenAI Image Generation error (${response.status}): ${errText}`);
        }

        const json = await response.json();
        return {
            data: json.data || [],
            usage: json.usage,
            provider: "openai",
            model
        };
    }
}

export async function callEditImageApi(
    auth: ProviderAuth,
    params: ImageEditInput,
    signal?: AbortSignal
): Promise<ImageApiResponse> {
    if (auth.provider === "xai") {
        const baseUrl = (auth.baseUrl || "https://api.x.ai/v1").replace(/\/+$/, "");

        let imagePayload: any;
        if (Array.isArray(params.image)) {
            imagePayload = params.image.map((img) => ({
                url: imageInputToDataUri(img),
                type: "image_url"
            }));
        } else {
            imagePayload = {
                url: imageInputToDataUri(params.image),
                type: "image_url"
            };
        }

        const requestBody = buildXaiEditBody(params, imagePayload);
        const model = String(requestBody.model);

        const response = await fetch(`${baseUrl}/images/edits`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${auth.apiKey}`
            },
            body: JSON.stringify(requestBody),
            signal
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`xAI Image Edit error (${response.status}): ${errText}`);
        }

        const json = await response.json();
        return {
            data: json.data || [],
            usage: json.usage,
            provider: "xai",
            model
        };
    } else {
        throw new Error("Image editing is currently best supported with xAI Grok Imagine (XAI_API_KEY).");
    }
}
