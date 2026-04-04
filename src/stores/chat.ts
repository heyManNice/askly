import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { streamAssistant, type ChatMessage } from "../services/llm";
import { useSettingsStore } from "./settings";

const CHAT_DB_NAME = "ezi-ai-db";
const CHAT_DB_VERSION = 2;
const CHAT_META_STORE_NAME = "chat-meta";
const CHAT_CONVERSATION_STORE_NAME = "chat-conversations";
const CHAT_META_KEY = "meta";
const PERSIST_DEBOUNCE_MS = 400;

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

type ChatMetaRecord = {
    id: string;
    activeConversationId: string | null;
    conversationOrder: string[];
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

function buildInitialSnapshot(): ChatSnapshot {
    const initial = buildNewConversation();
    return {
        conversations: [initial],
        activeConversationId: initial.id,
    };
}

function normalizeMessage(raw: unknown): ChatMessage | null {
    if (typeof raw !== "object" || raw === null) {
        return null;
    }

    const message = raw as Partial<ChatMessage>;
    if (typeof message.id !== "string" || typeof message.content !== "string") {
        return null;
    }
    if (message.role !== "user" && message.role !== "assistant") {
        return null;
    }

    const createdAt =
        typeof message.createdAt === "number" && Number.isFinite(message.createdAt)
            ? message.createdAt
            : Date.now();

    return {
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt,
    };
}

function normalizeConversation(raw: unknown): ChatConversation | null {
    if (typeof raw !== "object" || raw === null) {
        return null;
    }

    const conversation = raw as Partial<ChatConversation>;
    if (typeof conversation.id !== "string") {
        return null;
    }

    const messages = Array.isArray(conversation.messages)
        ? conversation.messages
            .map((item) => normalizeMessage(item))
            .filter((item): item is ChatMessage => item !== null)
        : [];

    const createdAt =
        typeof conversation.createdAt === "number" && Number.isFinite(conversation.createdAt)
            ? conversation.createdAt
            : Date.now();

    const updatedAt =
        typeof conversation.updatedAt === "number" && Number.isFinite(conversation.updatedAt)
            ? conversation.updatedAt
            : createdAt;

    const title =
        typeof conversation.title === "string" && conversation.title.trim() !== ""
            ? conversation.title
            : getTitleFromMessages(messages);

    return {
        id: conversation.id,
        title,
        createdAt,
        updatedAt,
        messages,
    };
}

function normalizeMetaRecord(raw: unknown): ChatMetaRecord | null {
    if (typeof raw !== "object" || raw === null) {
        return null;
    }

    const meta = raw as Partial<ChatMetaRecord>;
    const conversationOrder = Array.isArray(meta.conversationOrder)
        ? meta.conversationOrder.filter((id): id is string => typeof id === "string")
        : [];

    return {
        id: CHAT_META_KEY,
        activeConversationId: typeof meta.activeConversationId === "string" ? meta.activeConversationId : null,
        conversationOrder,
    };
}

function normalizeSnapshot(raw: unknown): ChatSnapshot {
    if (!raw) {
        return buildInitialSnapshot();
    }

    try {
        const parsed = typeof raw === "string" ? (JSON.parse(raw) as Partial<ChatSnapshot>) : (raw as Partial<ChatSnapshot>);
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
            return buildInitialSnapshot();
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

function openChatDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
            reject(new Error("IndexedDB is not available"));
            return;
        }

        const request = indexedDB.open(CHAT_DB_NAME, CHAT_DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(CHAT_META_STORE_NAME)) {
                db.createObjectStore(CHAT_META_STORE_NAME, { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains(CHAT_CONVERSATION_STORE_NAME)) {
                db.createObjectStore(CHAT_CONVERSATION_STORE_NAME, { keyPath: "id" });
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error ?? new Error("Failed to open IndexedDB"));
        };
    });
}

function readSnapshotFromDb(): Promise<ChatSnapshot | null> {
    return new Promise((resolve, reject) => {
        void openChatDb()
            .then((db) => {
                const tx = db.transaction([CHAT_META_STORE_NAME, CHAT_CONVERSATION_STORE_NAME], "readonly");
                const metaStore = tx.objectStore(CHAT_META_STORE_NAME);
                const conversationStore = tx.objectStore(CHAT_CONVERSATION_STORE_NAME);
                const metaRequest = metaStore.get(CHAT_META_KEY);
                const conversationsRequest = conversationStore.getAll();

                tx.oncomplete = () => {
                    db.close();

                    const meta = normalizeMetaRecord(metaRequest.result);
                    const normalizedConversations = Array.isArray(conversationsRequest.result)
                        ? conversationsRequest.result
                            .map((item) => normalizeConversation(item))
                            .filter((item): item is ChatConversation => item !== null)
                        : [];

                    if (normalizedConversations.length === 0) {
                        resolve(null);
                        return;
                    }

                    const order = meta?.conversationOrder ?? [];
                    const orderMap = new Map(order.map((id, index) => [id, index]));
                    const orderedConversations = [...normalizedConversations].sort((a, b) => {
                        const indexA = orderMap.get(a.id);
                        const indexB = orderMap.get(b.id);

                        if (indexA !== undefined && indexB !== undefined) {
                            return indexA - indexB;
                        }
                        if (indexA !== undefined) {
                            return -1;
                        }
                        if (indexB !== undefined) {
                            return 1;
                        }
                        return b.updatedAt - a.updatedAt;
                    });

                    const activeConversationId =
                        meta?.activeConversationId && orderedConversations.some((item) => item.id === meta.activeConversationId)
                            ? meta.activeConversationId
                            : orderedConversations[0].id;

                    resolve(
                        normalizeSnapshot({
                            conversations: orderedConversations,
                            activeConversationId,
                        }),
                    );
                };

                tx.onerror = () => {
                    db.close();
                    reject(tx.error ?? new Error("Failed to read chat snapshot"));
                };

                metaRequest.onerror = () => {
                    reject(metaRequest.error ?? new Error("Failed to read chat meta"));
                };

                conversationsRequest.onerror = () => {
                    reject(conversationsRequest.error ?? new Error("Failed to read conversations"));
                };
            })
            .catch((error) => {
                reject(error);
            });
    });
}

function toPersistableSnapshot(snapshot: ChatSnapshot): ChatSnapshot {
    // Strip Vue proxies/reactive wrappers so IndexedDB can clone the value safely.
    return normalizeSnapshot(JSON.parse(JSON.stringify(snapshot)) as Partial<ChatSnapshot>);
}

function writeSnapshotToDb(snapshot: ChatSnapshot): Promise<void> {
    return new Promise((resolve, reject) => {
        void openChatDb()
            .then((db) => {
                const persistableSnapshot = toPersistableSnapshot(snapshot);
                const tx = db.transaction([CHAT_META_STORE_NAME, CHAT_CONVERSATION_STORE_NAME], "readwrite");
                const metaStore = tx.objectStore(CHAT_META_STORE_NAME);
                const conversationStore = tx.objectStore(CHAT_CONVERSATION_STORE_NAME);
                const nextConversationIds = new Set(persistableSnapshot.conversations.map((item) => item.id));

                metaStore.put({
                    id: CHAT_META_KEY,
                    activeConversationId: persistableSnapshot.activeConversationId,
                    conversationOrder: persistableSnapshot.conversations.map((item) => item.id),
                } satisfies ChatMetaRecord);

                const keysRequest = conversationStore.getAllKeys();

                keysRequest.onsuccess = () => {
                    const existingIds = keysRequest.result
                        .filter((key): key is string => typeof key === "string");

                    for (const id of existingIds) {
                        if (!nextConversationIds.has(id)) {
                            conversationStore.delete(id);
                        }
                    }

                    for (const conversation of persistableSnapshot.conversations) {
                        conversationStore.put(conversation);
                    }
                };

                keysRequest.onerror = () => {
                    reject(keysRequest.error ?? new Error("Failed to enumerate conversation keys"));
                };

                tx.oncomplete = () => {
                    db.close();
                    resolve();
                };

                tx.onerror = () => {
                    db.close();
                    reject(tx.error ?? new Error("Failed to write chat snapshot"));
                };
            })
            .catch((error) => {
                reject(error);
            });
    });
}

export const useChatStore = defineStore("chat", () => {
    const snapshot = ref<ChatSnapshot>(buildInitialSnapshot());
    const isHydrated = ref(false);
    const isLoading = ref(false);
    const errorMessage = ref("");

    let persistTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingPersistSnapshot: ChatSnapshot | null = null;
    let persistQueue: Promise<void> = Promise.resolve();

    function schedulePersist(nextSnapshot: ChatSnapshot) {
        pendingPersistSnapshot = toPersistableSnapshot(nextSnapshot);
        if (persistTimer !== null) {
            return;
        }

        persistTimer = setTimeout(() => {
            persistTimer = null;
            const snapshotToSave = pendingPersistSnapshot;
            pendingPersistSnapshot = null;
            if (!snapshotToSave) {
                return;
            }

            persistQueue = persistQueue
                .then(() => writeSnapshotToDb(snapshotToSave))
                .catch((error) => {
                    console.warn("Failed to persist chat snapshot to IndexedDB", error);
                });
        }, PERSIST_DEBOUNCE_MS);
    }

    async function hydrateSnapshot() {
        try {
            const dbSnapshot = await readSnapshotFromDb();
            if (dbSnapshot) {
                snapshot.value = dbSnapshot;
                return;
            }

            await writeSnapshotToDb(snapshot.value);
        } catch (error) {
            console.warn("Failed to hydrate chat snapshot from IndexedDB", error);
        } finally {
            isHydrated.value = true;
        }
    }

    void hydrateSnapshot();

    watch(
        snapshot,
        (value) => {
            if (!isHydrated.value) {
                return;
            }

            schedulePersist(value);
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
