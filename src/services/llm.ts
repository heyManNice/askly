import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

export type LlmRuntimeSettings = {
    apiKey: string;
    baseUrl: string;
    model: string;
    temperature: number;
    systemPrompt: string;
    outputLimit?: number;
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
    id: string;
    role: ChatRole;
    content: string;
    createdAt: number;
};

function buildModel(settings: LlmRuntimeSettings) {
    const apiKey = settings.apiKey.trim();
    if (!apiKey) {
        throw new Error("请先在设置中填写 API Key。");
    }

    const modelName = settings.model.trim() || "gpt-4o-mini";
    const baseURL = settings.baseUrl.trim() || "https://api.openai.com/v1";

    return new ChatOpenAI({
        apiKey,
        model: modelName,
        temperature: settings.temperature,
        maxTokens:
            typeof settings.outputLimit === "number" && Number.isFinite(settings.outputLimit) && settings.outputLimit > 0
                ? Math.floor(settings.outputLimit)
                : undefined,
        configuration: {
            baseURL,
        },
    });
}

function buildLangchainMessages(
    settings: LlmRuntimeSettings,
    messages: ChatMessage[],
) {
    const langchainMessages = [];

    if (settings.systemPrompt.trim() !== "") {
        langchainMessages.push(new SystemMessage(settings.systemPrompt.trim()));
    }

    for (const msg of messages) {
        if (msg.role === "user") {
            langchainMessages.push(new HumanMessage(msg.content));
        } else {
            langchainMessages.push(new AIMessage(msg.content));
        }
    }

    return langchainMessages;
}

function chunkToText(chunk: unknown) {
    if (typeof chunk !== "object" || chunk === null) {
        return "";
    }

    const maybeText = (chunk as { text?: unknown }).text;
    if (typeof maybeText === "string") {
        return maybeText;
    }

    const content = (chunk as { content?: unknown }).content;
    if (typeof content === "string") {
        return content;
    }

    if (Array.isArray(content)) {
        return content
            .map((item) => {
                if (typeof item === "string") {
                    return item;
                }
                if (
                    typeof item === "object" &&
                    item !== null &&
                    "text" in item &&
                    typeof (item as { text: unknown }).text === "string"
                ) {
                    return (item as { text: string }).text;
                }
                return "";
            })
            .join("");
    }

    return "";
}

export async function streamAssistant(
    settings: LlmRuntimeSettings,
    messages: ChatMessage[],
    onToken: (token: string) => void,
): Promise<string> {
    const model = buildModel(settings);
    const langchainMessages = buildLangchainMessages(settings, messages);

    const stream = await model.stream(langchainMessages);
    let fullText = "";

    for await (const chunk of stream) {
        const token = chunkToText(chunk);
        if (!token) {
            continue;
        }
        fullText += token;
        onToken(token);
    }

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
    let result = "";
    await streamAssistant(settings, messages, (token) => {
        result += token;
    });

    return result;
}
