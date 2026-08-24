import { describe, expect, it } from "bun:test";
import { searchPromptCases } from "../src/search_prompt_cases.ts";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

const dummyContext = {} as ExtensionContext;

describe("searchPromptCases", () => {
    it("should search cases by keywords like '水晶'", async () => {
        const result = await searchPromptCases(
            "test-1",
            { query: "水晶", limit: 3 },
            new AbortController().signal,
            undefined,
            dummyContext
        );

        expect(result.details.count).toBeGreaterThan(0);
        expect(result.details.cases[0].title).toContain("水晶");
        expect(result.details.cases[0].prompt).toBeDefined();
    });

    it("should filter cases by category", async () => {
        const result = await searchPromptCases(
            "test-2",
            { category: "Posters & Typography", limit: 3 },
            new AbortController().signal,
            undefined,
            dummyContext
        );

        expect(result.details.count).toBe(3);
        for (const item of result.details.cases) {
            expect(item.category).toBe("Posters & Typography");
        }
    });

    it("should search cases by multiple keywords and styles", async () => {
        const result = await searchPromptCases(
            "test-3",
            { query: "六宫格 柠檬 饮料", limit: 1 },
            new AbortController().signal,
            undefined,
            dummyContext
        );

        expect(result.details.count).toBe(1);
        expect(result.details.cases[0].id).toBe(532);
        expect(result.details.cases[0].prompt).toContain("LIMORA");
    });

    it("should extract slots if available", async () => {
        const result = await searchPromptCases(
            "test-4",
            { query: "水晶框国家旅行", limit: 1 },
            new AbortController().signal,
            undefined,
            dummyContext
        );

        expect(result.details.count).toBe(1);
        expect(result.details.cases[0].id).toBe(531);
        expect(result.details.cases[0].slots).toContain("COUNTRY");
    });
});
