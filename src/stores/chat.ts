import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { streamAssistant, type ChatMessage } from "../services/llm";
import { useSettingsStore } from "./settings";

const CHAT_STORAGE_KEY = "ezi-ai-chat-v1";

type ChatConversation = {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
};

type ChatSnapshot = {
    conversations: ChatConversation[];
    activeConversationId: string | null;
};

function generateId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildNewConversation(): ChatConversation {
    const now = Date.now();
    return {
        id: generateId("conv"),
        title: "新对话",
        createdAt: now,
        updatedAt: now,
        messages: [],
    };
}

function getTitleFromMessages(messages: ChatMessage[]) {
    const firstUser = messages.find((msg) => msg.role === "user");
    if (!firstUser) {
        return "新对话";
    }

    const cleaned = firstUser.content.replace(/\s+/g, " ").trim();
    return cleaned.length > 20 ? `${cleaned.slice(0, 20)}...` : cleaned;
}

function parseSnapshot(raw: string | null): ChatSnapshot {
    if (!raw) {
        const initial = buildNewConversation();
        return {
            conversations: [initial],
            activeConversationId: initial.id,
        };
    }

    try {
        const parsed = JSON.parse(raw) as Partial<ChatSnapshot>;
        const conversations = Array.isArray(parsed.conversations)
            ? parsed.conversations.filter((item): item is ChatConversation => {
                return (
                    typeof item?.id === "string" &&
                    typeof item?.title === "string" &&
                    Array.isArray(item?.messages)
                );
            })
            : [];

        if (conversations.length === 0) {
            const initial = buildNewConversation();
            return {
                conversations: [initial],
                activeConversationId: initial.id,
            };
        }

        const activeConversationId =
            typeof parsed.activeConversationId === "string" &&
                conversations.some((item) => item.id === parsed.activeConversationId)
                ? parsed.activeConversationId
                : conversations[0].id;

        return {
            conversations,
            activeConversationId,
        };
    } catch {
        const initial = buildNewConversation();
        return {
            conversations: [initial],
            activeConversationId: initial.id,
        };
    }
}

export const useChatStore = defineStore("chat", () => {
    const snapshot = ref<ChatSnapshot>(parseSnapshot(localStorage.getItem(CHAT_STORAGE_KEY)));
    const isLoading = ref(false);
    const errorMessage = ref("");

    watch(
        snapshot,
        (value) => {
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(value));
        },
        { deep: true },
    );

    const conversations = computed(() => {
        return [...snapshot.value.conversations].sort((a, b) => b.updatedAt - a.updatedAt);
    });

    const activeConversation = computed(() => {
        const activeId = snapshot.value.activeConversationId;
        return snapshot.value.conversations.find((item) => item.id === activeId) ?? null;
    });

    function setActiveConversation(id: string) {
        if (!snapshot.value.conversations.some((item) => item.id === id)) {
            return;
        }
        snapshot.value.activeConversationId = id;
    }

    function createConversation() {
        const next = buildNewConversation();
        snapshot.value.conversations.unshift(next);
        snapshot.value.activeConversationId = next.id;
        errorMessage.value = "";
    }

    function removeConversation(id: string) {
        const index = snapshot.value.conversations.findIndex((item) => item.id === id);
        if (index < 0) {
            return;
        }

        snapshot.value.conversations.splice(index, 1);

        if (snapshot.value.conversations.length === 0) {
            const next = buildNewConversation();
            snapshot.value.conversations.push(next);
            snapshot.value.activeConversationId = next.id;
            return;
        }

        if (snapshot.value.activeConversationId === id) {
            snapshot.value.activeConversationId = snapshot.value.conversations[0].id;
        }
    }

    async function sendMessage(content: string) {
        const question = content.trim();
        if (question === "" || isLoading.value) {
            return;
        }

        let target = activeConversation.value;
        if (!target) {
            createConversation();
            target = activeConversation.value;
        }

        if (!target) {
            return;
        }

        errorMessage.value = "";

        const userMessage: ChatMessage = {
            id: generateId("msg"),
            role: "user",
            content: question,
            createdAt: Date.now(),
        };

        target.messages.push(userMessage);
        target.title = getTitleFromMessages(target.messages);
        target.updatedAt = Date.now();

        const settingsStore = useSettingsStore();
        const assistantMessage: ChatMessage = {
            id: generateId("msg"),
            role: "assistant",
            content: "",
            createdAt: Date.now(),
        };

        target.messages.push(assistantMessage);

        isLoading.value = true;
        try {
            const finalAnswer = await streamAssistant(
                settingsStore.settings,
                target.messages,
                (token) => {
                    assistantMessage.content += token;
                    target.updatedAt = Date.now();
                },
            );

            assistantMessage.content = finalAnswer;
            target.updatedAt = Date.now();
        } catch (error) {
            if (assistantMessage.content.trim() === "") {
                target.messages = target.messages.filter((msg) => msg.id !== assistantMessage.id);
            }

            errorMessage.value = error instanceof Error ? error.message : "请求失败，请稍后再试。";
        } finally {
            if (
                assistantMessage.content.trim() === "" &&
                target.messages.some((msg) => msg.id === assistantMessage.id)
            ) {
                assistantMessage.content = "(未收到有效响应)";
            }
            target.updatedAt = Date.now();
            isLoading.value = false;
        }
    }

    return {
        conversations,
        activeConversation,
        isLoading,
        errorMessage,
        setActiveConversation,
        createConversation,
        removeConversation,
        sendMessage,
    };
});
