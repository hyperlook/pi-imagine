import { expect, test } from "bun:test";
import { buildXaiEditBody, buildXaiGenerateBody, DEFAULT_XAI_IMAGE_MODEL } from "../src/payload.ts";
import { detectImageExtension } from "../src/utils.ts";

test("省略字段时对齐 Grok Build payload", () => {
    expect(buildXaiGenerateBody({ prompt: "a red apple" })).toEqual({
        model: DEFAULT_XAI_IMAGE_MODEL,
        prompt: "a red apple",
        n: 1,
        aspect_ratio: "auto",
        resolution: "1k",
        response_format: "b64_json"
    });
});

test("用户意图升档时透传 2.0 / 2k / medium", () => {
    expect(buildXaiGenerateBody({
        prompt: "poster",
        model: "grok-imagine-image-2.0",
        resolution: "2k",
        quality: "medium",
        aspect_ratio: "16:9"
    })).toEqual({
        model: "grok-imagine-image-2.0",
        prompt: "poster",
        n: 1,
        aspect_ratio: "16:9",
        resolution: "2k",
        response_format: "b64_json",
        quality: "medium"
    });
});

test("非 2.0 模型忽略 quality", () => {
    const body = buildXaiGenerateBody({
        prompt: "cat",
        model: "grok-imagine-image",
        quality: "medium"
    });
    expect(body.quality).toBeUndefined();
    expect(body.model).toBe("grok-imagine-image");
});

test("编辑接口同样默认 1k + b64_json", () => {
    expect(buildXaiEditBody({ prompt: "make it night", image: "./a.jpg" }, [{ url: "data:x" }])).toEqual({
        model: DEFAULT_XAI_IMAGE_MODEL,
        prompt: "make it night",
        image: { url: "data:x" },
        resolution: "1k",
        response_format: "b64_json"
    });
});

test("单图编辑走 image 对象，不写 images", () => {
    const body = buildXaiEditBody(
        { prompt: "sketch", image: "./a.jpg" },
        [{ url: "data:person" }]
    );
    expect(body.image).toEqual({ url: "data:person" });
    expect(body.images).toBeUndefined();
    expect(body.aspect_ratio).toBeUndefined();
});

test("单元素数组仍走 image 字段", () => {
    const body = buildXaiEditBody(
        { prompt: "sketch", image: ["./a.jpg"] },
        [{ url: "data:person" }]
    );
    expect(body.image).toEqual({ url: "data:person" });
    expect(body.images).toBeUndefined();
});

test("多图编辑走 images 数组，与 image 互斥", () => {
    const body = buildXaiEditBody(
        {
            prompt: "Keep the face from <IMAGE_0>. Dress them in the outfit from <IMAGE_1>.",
            image: ["./person.jpg", "./clothes.jpg"],
            aspect_ratio: "2:3"
        },
        [{ url: "data:person" }, { url: "data:clothes" }]
    );
    expect(body.images).toEqual([{ url: "data:person" }, { url: "data:clothes" }]);
    expect(body.image).toBeUndefined();
    expect(body.aspect_ratio).toBe("2:3");
});

test("多图未指定比例时默认 auto", () => {
    const body = buildXaiEditBody(
        { prompt: "merge", image: ["./a.jpg", "./b.jpg"] },
        [{ url: "data:a" }, { url: "data:b" }]
    );
    expect(body.aspect_ratio).toBe("auto");
    expect(body.images).toHaveLength(2);
});

test("空参考图数组抛错", () => {
    expect(() => buildXaiEditBody({ prompt: "x", image: "./a.jpg" }, [])).toThrow(
        "at least one reference image"
    );
});

test("JPEG 魔数保存为 .jpg", () => {
    expect(detectImageExtension(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(".jpg");
    expect(detectImageExtension(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(".png");
});
