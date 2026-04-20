import {
    AIMessage,
    HumanMessage,
    SystemMessage,
    type BaseMessage,
} from "@langchain/core/messages";
import {
    getAiFunctionInfos,
} from "@functions/main";
import type {
    ChatMessage,
    LlmRuntimeSettings,
} from "./types";

export function buildLangchainMessages(
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