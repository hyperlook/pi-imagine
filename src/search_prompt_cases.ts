import type { ExtensionContext, AgentToolUpdateCallback, AgentToolResult } from "@earendil-works/pi-coding-agent";
import { SearchPromptCasesSchema, type SearchPromptCasesInput, type PromptCaseItem } from "./types.ts";
import promptCasesRaw from "./data/prompt_cases.json" with { type: "json" };

export { SearchPromptCasesSchema };

const ALL_CASES: PromptCaseItem[] = promptCasesRaw as PromptCaseItem[];

/**
 * 提取文本中的关键词 (支持中英文、去除标点)
 */
function tokenize(text: string): string[] {
    if (!text) return [];
    // 匹配英文单词、中文字词片段、数字
    const words = text.toLowerCase().match(/[\u4e00-\u9fa5]{1,2}|[a-z0-9_-]+/g) || [];
    return words.filter((w) => w.length > 0);
}

/**
 * 自动识别 Prompt 中的变量插槽 (如 [COUNTRY], [PRODUCT], [BRAND] 等)
 */
function extractSlots(prompt: string): string[] {
    const matches = prompt.match(/\[([A-Z0-9_\-\s]+)\]/g) || [];
    return Array.from(new Set(matches.map((m) => m.slice(1, -1).trim())));
}

export async function searchPromptCases(
    id: string,
    params: SearchPromptCasesInput,
    signal: AbortSignal,
    onUpdate: AgentToolUpdateCallback | undefined,
    ctx: ExtensionContext
): Promise<AgentToolResult<any>> {
    const limit = Math.min(Math.max(params.limit || 3, 1), 10);
    const query = params.query?.trim() || "";
    const categoryFilter = params.category?.trim().toLowerCase();
    const styleFilter = params.style?.trim().toLowerCase();
    const sceneFilter = params.scene?.trim().toLowerCase();

    const queryTokens = tokenize(query);

    interface ScoredCase {
        item: PromptCaseItem;
        score: number;
        matchedReasons: string[];
    }

    const scoredCases: ScoredCase[] = [];

    for (const item of ALL_CASES) {
        let score = 0;
        const matchedReasons: string[] = [];

        // 1. 显式分类过滤与加权
        if (categoryFilter) {
            if (item.category.toLowerCase().includes(categoryFilter)) {
                score += 50;
                matchedReasons.push(`Category matched: ${item.category}`);
            } else if (!query) {
                // 如果没有 query 且分类不匹配，直接跳过
                continue;
            }
        }

        // 2. 风格过滤与加权
        if (styleFilter) {
            const hasStyle = item.styles.some((s) => s.toLowerCase().includes(styleFilter));
            if (hasStyle) {
                score += 30;
                matchedReasons.push(`Style matched: ${styleFilter}`);
            } else if (!query && !categoryFilter) {
                continue;
            }
        }

        // 3. 场景过滤与加权
        if (sceneFilter) {
            const hasScene = item.scenes.some((s) => s.toLowerCase().includes(sceneFilter));
            if (hasScene) {
                score += 20;
                matchedReasons.push(`Scene matched: ${sceneFilter}`);
            } else if (!query && !categoryFilter && !styleFilter) {
                continue;
            }
        }

        // 4. 关键词分词打分
        if (queryTokens.length > 0) {
            const titleLower = item.title.toLowerCase();
            const promptLower = item.prompt.toLowerCase();
            const categoryLower = item.category.toLowerCase();
            const stylesLower = item.styles.map((s) => s.toLowerCase()).join(" ");
            const scenesLower = item.scenes.map((s) => s.toLowerCase()).join(" ");

            let queryHitCount = 0;

            for (const token of queryTokens) {
                let tokenHit = false;

                // 标题完全匹配 (高权重)
                if (titleLower.includes(token)) {
                    score += 25;
                    tokenHit = true;
                }

                // 风格或场景标签匹配
                if (stylesLower.includes(token) || scenesLower.includes(token)) {
                    score += 15;
                    tokenHit = true;
                }

                // 分类匹配
                if (categoryLower.includes(token)) {
                    score += 10;
                    tokenHit = true;
                }

                // 提示词正文匹配
                if (promptLower.includes(token)) {
                    score += 5;
                    tokenHit = true;
                }

                if (tokenHit) {
                    queryHitCount++;
                }
            }

            // 如果搜索词没有一个命中，排除
            if (queryHitCount === 0 && !categoryFilter && !styleFilter && !sceneFilter) {
                continue;
            }
        } else if (!categoryFilter && !styleFilter && !sceneFilter) {
            // 如果什么参数都没传，给一个基础分按 ID 倒序
            score = item.id;
        }

        scoredCases.push({ item, score, matchedReasons });
    }

    // 按得分倒序，得分相同时按 ID 倒序
    scoredCases.sort((a, b) => b.score - a.score || b.item.id - a.item.id);

    const topResults = scoredCases.slice(0, limit);

    if (topResults.length === 0) {
        return {
            content: [{
                type: "text",
                text: `No matching prompt cases found for query="${query}". Try broader keywords (e.g. 'poster', '3D', 'UI', 'infographic', 'character').`
            }],
            details: { count: 0, cases: [] }
        };
    }

    // 格式化输出为清晰的结构化文本供 Agent 决策和调用
    let outputText = `### Found ${topResults.length} Golden Prompt Case(s) in Gallery:\n\n`;

    const formattedCases = topResults.map(({ item, score }, index) => {
        const slots = extractSlots(item.prompt);
        const slotText = slots.length > 0 ? `\n- **Configurable Slots**: \`${slots.map((s) => `[${s}]`).join(", ")}\`` : "";

        outputText += `#### [Option ${index + 1}] Case #${item.id}: ${item.title}\n`;
        outputText += `- **Category**: ${item.category}\n`;
        outputText += `- **Styles**: ${item.styles.join(", ")} | **Scenes**: ${item.scenes.join(", ")}${slotText}\n`;
        outputText += `\n\`\`\`text\n${item.prompt}\n\`\`\`\n\n`;

        return {
            id: item.id,
            title: item.title,
            category: item.category,
            styles: item.styles,
            scenes: item.scenes,
            slots,
            prompt: item.prompt,
            image: item.image
        };
    });

    outputText += `\n> **Agent Guidance**: Review the options above. Select the best match for the user's intent, substitute any slots (e.g. \`[PRODUCT]\`, \`[COUNTRY]\`, or specific subjects), keep the delicate materials/lighting/optics/negative constraints intact, and call \`image_gen\` to create the final image.`;

    return {
        content: [{
            type: "text",
            text: outputText
        }],
        details: {
            count: formattedCases.length,
            cases: formattedCases
        }
    };
}
