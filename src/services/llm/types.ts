export type LlmRuntimeSettings = {
    apiKey: string;
    baseUrl: string;
    model: string;
    temperature: number;
    systemPrompt: string;
    outputLimit?: number;
};

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
    id: string;
    role: ChatRole;
    content: string;
    createdAt: number;
};

export type NormalizedToolCall = {
    id: string;
    name: string;
    args: unknown;
};

export type StreamResult = {
    fullText: string;
    toolCalls: NormalizedToolCall[];
};