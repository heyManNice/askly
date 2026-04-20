import { ChatOpenAI } from "@langchain/openai";
import type { LlmRuntimeSettings } from "./types";

export function buildModel(settings: LlmRuntimeSettings) {
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