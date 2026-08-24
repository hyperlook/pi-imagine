import extension from "../src/index.ts";

const registeredTools: any[] = [];
const mockPi: any = {
    registerTool: (tool: any) => {
        registeredTools.push(tool);
    },
    on: () => {}
};

extension(mockPi);

console.log("Registered tools count:", registeredTools.length);
for (const tool of registeredTools) {
    console.log(`- Tool: ${tool.name} (${tool.label}): ${tool.description}`);
}

if (registeredTools.length === 3) {
    console.log("All tools registered successfully!");
} else {
    throw new Error(`Expected 3 registered tools, got ${registeredTools.length}`);
}
