import {
    AIMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
    type BaseMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import {
    getAiFunctionInfos,
    getAiFunctions,
} from "@functions/main";

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
    const langchainMessages: BaseMessage[] = [];

    if (settings.systemPrompt.trim() !== "") {
        langchainMessages.push(new SystemMessage(settings.systemPrompt.trim()));
    }

    const functionInfos = getAiFunctionInfos();
    if (functionInfos.length > 0) {
        langchainMessages.push(
            new SystemMessage(
                [
                    "以下是可用函数信息（JSON 字符串数组）。",
                    "当需要调用函数时，请使用函数调用能力，不要把函数调用写成普通文本。",
                    ...functionInfos,
                ].join("\n"),
            ),
        );
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

type NormalizedToolCall = {
    id: string;
    name: string;
    args: unknown;
};

type StreamResult = {
    fullText: string;
    toolCalls: NormalizedToolCall[];
};

function normalizeToolCalls(message: AIMessage): NormalizedToolCall[] {
    const fromToolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
    if (fromToolCalls.length > 0) {
        const normalized: NormalizedToolCall[] = [];

        for (let index = 0; index < fromToolCalls.length; index += 1) {
            const call = fromToolCalls[index];
            if (!call || typeof call.name !== "string") {
                continue;
            }

            normalized.push({
                id: typeof call.id === "string" ? call.id : `tool-${Date.now()}-${index}`,
                name: call.name,
                args: call.args,
            });
        }

        return normalized;
    }

    const additional = message.additional_kwargs;
    if (typeof additional !== "object" || additional === null || !Array.isArray(additional.tool_calls)) {
        return [];
    }

    return additional.tool_calls
        .map((item, index) => {
            if (typeof item !== "object" || item === null) {
                return null;
            }

            const id = "id" in item && typeof item.id === "string"
                ? item.id
                : `tool-${Date.now()}-${index}`;

            if (!("function" in item) || typeof item.function !== "object" || item.function === null) {
                return null;
            }

            const fn = item.function as { name?: unknown; arguments?: unknown };
            if (typeof fn.name !== "string") {
                return null;
            }

            return {
                id,
                name: fn.name,
                args: fn.arguments,
            };
        })
        .filter((entry): entry is NormalizedToolCall => entry !== null);
}

function parseToolArgs(args: unknown): unknown {
    if (typeof args === "string") {
        const text = args.trim();
        if (!text) {
            return {};
        }

        try {
            return JSON.parse(text);
        } catch {
            return {
                raw: text,
            };
        }
    }

    if (typeof args === "object" && args !== null) {
        return args;
    }

    return {};
}

function toToolCallArgsRecord(args: unknown): Record<string, any> {
    const parsed = parseToolArgs(args);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, any>;
    }

    return {
        value: parsed,
    };
}

function normalizeToolResult(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }

    if (value === null || typeof value === "undefined") {
        return "";
    }

    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function contentToText(content: AIMessage["content"]): string {
    if (typeof content === "string") {
        return content;
    }

    if (!Array.isArray(content)) {
        return "";
    }

    return content
        .map((item) => {
            if (typeof item === "string") {
                return item;
            }
            if (
                typeof item === "object" &&
                item !== null &&
                "text" in item &&
                typeof (item as { text?: unknown }).text === "string"
            ) {
                return (item as { text: string }).text;
            }
            return "";
        })
        .join("");
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

function collectToolCallsFromStreamChunk(
    chunk: unknown,
    completeCalls: NormalizedToolCall[],
    chunkedCalls: Map<number, { id: string; name: string; argsText: string }>,
) {
    if (typeof chunk !== "object" || chunk === null) {
        return;
    }

    const nowSeed = Date.now();

    const directToolCalls = (chunk as { tool_calls?: unknown }).tool_calls;
    if (Array.isArray(directToolCalls)) {
        for (let i = 0; i < directToolCalls.length; i += 1) {
            const item = directToolCalls[i];
            if (typeof item !== "object" || item === null) {
                continue;
            }

            const name = "name" in item && typeof item.name === "string" ? item.name : "";
            if (!name) {
                continue;
            }

            const id = "id" in item && typeof item.id === "string"
                ? item.id
                : `tool-${nowSeed}-${i}`;

            const args = "args" in item ? item.args : {};
            completeCalls.push({
                id,
                name,
                args,
            });
        }
    }

    const toolCallChunks = (chunk as { tool_call_chunks?: unknown }).tool_call_chunks;
    if (Array.isArray(toolCallChunks)) {
        for (let i = 0; i < toolCallChunks.length; i += 1) {
            const item = toolCallChunks[i];
            if (typeof item !== "object" || item === null) {
                continue;
            }

            const index = "index" in item && typeof item.index === "number" ? item.index : i;
            const previous = chunkedCalls.get(index) ?? {
                id: `tool-${nowSeed}-${index}`,
                name: "",
                argsText: "",
            };

            if ("id" in item && typeof item.id === "string") {
                previous.id = item.id;
            }
            if ("name" in item && typeof item.name === "string") {
                previous.name = item.name;
            }
            if ("args" in item && typeof item.args === "string") {
                previous.argsText += item.args;
            }

            chunkedCalls.set(index, previous);
        }
    }
}

function finalizeStreamToolCalls(
    completeCalls: NormalizedToolCall[],
    chunkedCalls: Map<number, { id: string; name: string; argsText: string }>,
) {
    if (completeCalls.length > 0) {
        return completeCalls;
    }

    const built: NormalizedToolCall[] = [];
    for (const value of chunkedCalls.values()) {
        if (!value.name) {
            continue;
        }

        built.push({
            id: value.id,
            name: value.name,
            args: value.argsText,
        });
    }

    return built;
}

async function streamOneRound(
    model: ReturnType<ChatOpenAI["bindTools"]> | ChatOpenAI,
    conversation: BaseMessage[],
    onToken: (token: string) => void,
): Promise<StreamResult> {
    const stream = await model.stream(conversation);
    let fullText = "";

    const completeCalls: NormalizedToolCall[] = [];
    const chunkedCalls = new Map<number, { id: string; name: string; argsText: string }>();

    for await (const chunk of stream) {
        const token = chunkToText(chunk);
        if (token) {
            fullText += token;
            onToken(token);
        }

        collectToolCallsFromStreamChunk(chunk, completeCalls, chunkedCalls);
    }

    return {
        fullText,
        toolCalls: finalizeStreamToolCalls(completeCalls, chunkedCalls),
    };
}

async function askAssistantWithToolCalls(
    settings: LlmRuntimeSettings,
    messages: ChatMessage[],
    onToken?: (token: string) => void,
): Promise<string> {
    const model = buildModel(settings);
    const aiFunctions = getAiFunctions();
    const functionMap = new Map(aiFunctions.map((fn) => [fn.name, fn]));

    const modelWithTools = aiFunctions.length > 0
        ? model.bindTools(
            aiFunctions.map((fn) => {
                return {
                    name: fn.name,
                    description: fn.describe,
                    schema: fn.params,
                };
            }),
        )
        : model;

    const conversation = buildLangchainMessages(settings, messages);
    const maxToolRounds = 8;
    const emitToken = onToken ?? (() => undefined);

    for (let i = 0; i < maxToolRounds; i += 1) {
        const round = await streamOneRound(modelWithTools, conversation, emitToken);
        const toolCalls = round.toolCalls;
        if (toolCalls.length === 0) {
            return round.fullText;
        }

        const normalizedForMessage = toolCalls.map((call) => {
            return {
                id: call.id,
                name: call.name,
                args: toToolCallArgsRecord(call.args),
            };
        });

        conversation.push(
            new AIMessage({
                content: round.fullText,
                tool_calls: normalizedForMessage,
            }),
        );

        for (const call of toolCalls) {
            const fn = functionMap.get(call.name);

            let content = "";
            if (!fn) {
                content = `未找到函数: ${call.name}`;
            } else {
                try {
                    const parsedArgs = parseToolArgs(call.args);
                    const result = await fn.call(parsedArgs);
                    content = normalizeToolResult(result);
                } catch (error) {
                    content = error instanceof Error ? error.message : "函数调用失败";
                }
            }

            conversation.push(
                new ToolMessage({
                    tool_call_id: call.id,
                    content,
                }),
            );
        }
    }

    throw new Error("函数调用轮次过多，请检查提示词或函数定义。");
}

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
