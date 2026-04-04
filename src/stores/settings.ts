import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

const SETTINGS_STORAGE_KEY = "ezi-ai-settings-v1";

export type AssistantSettings = {
    apiKey: string;
    baseUrl: string;
    model: string;
    temperature: number;
    systemPrompt: string;
};

const defaultSettings: AssistantSettings = {
    apiKey: "",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    temperature: 0.4,
    systemPrompt: "You are a concise, practical AI assistant.",
};

function clampTemperature(value: number) {
    if (Number.isNaN(value)) {
        return defaultSettings.temperature;
    }
    return Math.min(2, Math.max(0, value));
}

function parseStoredSettings(raw: string | null): AssistantSettings {
    if (!raw) {
        return { ...defaultSettings };
    }

    try {
        const parsed = JSON.parse(raw) as Partial<AssistantSettings>;
        return {
            apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : defaultSettings.apiKey,
            baseUrl: typeof parsed.baseUrl === "string" && parsed.baseUrl.trim() !== ""
                ? parsed.baseUrl
                : defaultSettings.baseUrl,
            model: typeof parsed.model === "string" && parsed.model.trim() !== ""
                ? parsed.model
                : defaultSettings.model,
            temperature: clampTemperature(Number(parsed.temperature)),
            systemPrompt: typeof parsed.systemPrompt === "string"
                ? parsed.systemPrompt
                : defaultSettings.systemPrompt,
        };
    } catch {
        return { ...defaultSettings };
    }
}

export const useSettingsStore = defineStore("settings", () => {
    const settings = ref<AssistantSettings>(parseStoredSettings(localStorage.getItem(SETTINGS_STORAGE_KEY)));

    watch(
        settings,
        (value) => {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value));
        },
        { deep: true },
    );

    const hasApiKey = computed(() => settings.value.apiKey.trim().length > 0);

    function updateSettings(patch: Partial<AssistantSettings>) {
        settings.value = {
            ...settings.value,
            ...patch,
            temperature:
                patch.temperature !== undefined
                    ? clampTemperature(Number(patch.temperature))
                    : settings.value.temperature,
        };
    }

    function resetSettings() {
        settings.value = { ...defaultSettings };
    }

    return {
        settings,
        hasApiKey,
        updateSettings,
        resetSettings,
    };
});
