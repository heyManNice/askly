import type { BaseMessage } from "@langchain/core/messages";
import type {
    NormalizedToolCall,
    StreamResult,
} from "./types";

type ChunkedToolCall = {
    id: string;
    name: string;
    argsText: string;
};

type StreamChunk = {
    text?: unknown;
    content?: unknown;
    tool_calls?: unknown;
    tool_call_chunks?: unknown;
};

type StreamableModel = {
    stream: (conversation: BaseMessage[]) => Promise<AsyncIterable<unknown>>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
    if (typeof value === "object" && value !== null) {
        return value as Record<string, unknown>;
    }

    return null;
}

export function parseToolArgs(args: unknown): unknown {
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

export function toToolCallArgsRecord(args: unknown): Record<string, unknown> {
    const parsed = parseToolArgs(args);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
    }

    return {
        value: parsed,
    };
}

export function normalizeToolResult(value: unknown): string {
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

function chunkToText(chunk: unknown) {
    const record = asRecord(chunk);
    if (!record) {
        return "";
    }

    const maybeText = record.text;
    if (typeof maybeText === "string") {
        return maybeText;
    }

    const content = record.content;
    if (typeof content === "string") {
        return content;
    }

    if (Array.isArray(content)) {
        return content
            .map((item) => {
                if (typeof item === "string") {
                    return item;
                }

                const part = asRecord(item);
                if (part && typeof part.text === "string") {
                    return part.text;
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
    chunkedCalls: Map<number, ChunkedToolCall>,
) {
    const record = asRecord(chunk);
    if (!record) {
        return;
    }

    const nowSeed = Date.now();

    const directToolCalls = (record as StreamChunk).tool_calls;
    if (Array.isArray(directToolCalls)) {
        for (let i = 0; i < directToolCalls.length; i += 1) {
            const item = asRecord(directToolCalls[i]);
            if (!item) {
                continue;
            }

            const name = typeof item.name === "string" ? item.name : "";
            if (!name) {
                continue;
            }

            const id = typeof item.id === "string"
                ? item.id
                : `tool-${nowSeed}-${i}`;

            completeCalls.push({
                id,
                name,
                args: "args" in item ? item.args : {},
            });
        }
    }

    const toolCallChunks = (record as StreamChunk).tool_call_chunks;
    if (Array.isArray(toolCallChunks)) {
        for (let i = 0; i < toolCallChunks.length; i += 1) {
            const item = asRecord(toolCallChunks[i]);
            if (!item) {
                continue;
            }

            const index = typeof item.index === "number" ? item.index : i;
            const previous = chunkedCalls.get(index) ?? {
                id: `tool-${nowSeed}-${index}`,
                name: "",
                argsText: "",
            };

            if (typeof item.id === "string") {
                previous.id = item.id;
            }
            if (typeof item.name === "string") {
                previous.name = item.name;
            }
            if (typeof item.args === "string") {
                previous.argsText += item.args;
            }

            chunkedCalls.set(index, previous);
        }
    }
}

function finalizeStreamToolCalls(
    completeCalls: NormalizedToolCall[],
    chunkedCalls: Map<number, ChunkedToolCall>,
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

export async function streamOneRound(
    model: StreamableModel,
    conversation: BaseMessage[],
    onToken: (token: string) => void,
): Promise<StreamResult> {
    const stream = await model.stream(conversation);
    let fullText = "";

    const completeCalls: NormalizedToolCall[] = [];
    const chunkedCalls = new Map<number, ChunkedToolCall>();

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