import {
    AIMessage,
    ToolMessage,
} from "@langchain/core/messages";
import {
    getAiFunctions,
    type AiFunction,
} from "@functions/main";
import { buildLangchainMessages } from "./messages";
import { buildModel } from "./model";
import {
    normalizeToolResult,
    parseToolArgs,
    streamOneRound,
    toToolCallArgsRecord,
} from "./stream";
import type {
    ChatMessage,
    LlmRuntimeSettings,
} from "./types";

function buildFunctionMap(aiFunctions: AiFunction[]) {
    return new Map(aiFunctions.map((fn) => [fn.name, fn]));
}

function bindModelTools(model: ReturnType<typeof buildModel>, aiFunctions: AiFunction[]) {
    if (aiFunctions.length === 0) {
        return model;
    }

    return model.bindTools(
        aiFunctions.map((fn) => {
            return {
                name: fn.name,
                description: fn.describe,
                schema: fn.params,
            };
        }),
    );
}

async function executeToolCall(
    call: { id: string; name: string; args: unknown },
    functionMap: Map<string, AiFunction>,
) {
    const fn = functionMap.get(call.name);

    if (!fn) {
        return `未找到函数: ${call.name}`;
    }

    try {
        const parsedArgs = parseToolArgs(call.args);
        const result = await fn.call(parsedArgs);
        return normalizeToolResult(result);
    } catch (error) {
        return error instanceof Error ? error.message : "函数调用失败";
    }
}

export async function askAssistantWithToolCalls(
    settings: LlmRuntimeSettings,
    messages: ChatMessage[],
    onToken?: (token: string) => void,
): Promise<string> {
    const model = buildModel(settings);
    const aiFunctions = getAiFunctions();
    const functionMap = buildFunctionMap(aiFunctions);
    const modelWithTools = bindModelTools(model, aiFunctions);

    const conversation = buildLangchainMessages(settings, messages);
    const maxToolRounds = 8;
    const emitToken = onToken ?? (() => undefined);

    for (let i = 0; i < maxToolRounds; i += 1) {
        const round = await streamOneRound(modelWithTools, conversation, emitToken);
        if (round.toolCalls.length === 0) {
            return round.fullText;
        }

        conversation.push(
            new AIMessage({
                content: round.fullText,
                tool_calls: round.toolCalls.map((call) => {
                    return {
                        id: call.id,
                        name: call.name,
                        args: toToolCallArgsRecord(call.args),
                    };
                }),
            }),
        );

        for (const call of round.toolCalls) {
            const content = await executeToolCall(call, functionMap);
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