import { askAssistantWithToolCalls } from "./llm/agent";
import type {
    ChatMessage,
    ChatRole,
    LlmRuntimeSettings,
} from "./llm/types";

export type {
    ChatMessage,
    ChatRole,
    LlmRuntimeSettings,
};

export async function streamAssistant(
    settings: LlmRuntimeSettings,
    messages: ChatMessage[],
    onToken: (token: string) => void,
): Promise<string> {
    const fullText = await askAssistantWithToolCalls(settings, messages, onToken);

    const trimmed = fullText.trim();
    if (trimmed === "") {
        throw new Error("模型返回了空内容，请尝试调整模型或提示词。");
    }

    return fullText;
}

export async function askAssistant(
    settings: LlmRuntimeSettings,
    messages: ChatMessage[],
): Promise<string> {
    return askAssistantWithToolCalls(settings, messages);
}
