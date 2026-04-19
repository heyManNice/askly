import {
    defineStore
} from 'pinia';

import {
    computed,
    ref
} from 'vue';

import Dexie from 'dexie';

import {
    apis,
    coldMessages,
    hotMessages,
    roles,
    type DBKey
} from '@databases/main';

import {
    streamAssistant,
    type ChatMessage,
    type LlmRuntimeSettings
} from '@services/llm';

type ChatTableMessage = DBKey<typeof hotMessages>;

type RoleSummary = {
    roleId: number;
    lastMessage: string;
    updatedAt: Date | null;
    total: number;
};

type RoleWindowState = {
    hasOlder: boolean;
    hasNewer: boolean;
};

const WINDOW_SIZE = 20;
const WINDOW_STEP = 14;
const OVERLAP_SIZE = WINDOW_SIZE - WINDOW_STEP;
const DEFAULT_CONTEXT_LIMIT = 48;

const HOT_KEEP_COUNT = 1;

function generateUuid(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toTimestamp(value: Date) {
    return value.getTime();
}

function sortMessagesAsc(list: ChatTableMessage[]) {
    return [...list].sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
}

function mergeAndTrimMessages(list: ChatTableMessage[], limit: number) {
    return sortMessagesAsc(list).slice(-limit);
}

async function queryLatestMessagesFromTable(
    table: typeof hotMessages,
    roleId: number,
    limit: number,
) {
    return table
        .where('[roleId+createdAt]')
        .between([roleId, Dexie.minKey], [roleId, Dexie.maxKey])
        .reverse()
        .limit(limit)
        .toArray();
}

async function queryOlderMessagesFromTable(
    table: typeof hotMessages,
    roleId: number,
    anchor: Date,
    limit: number,
) {
    return table
        .where('[roleId+createdAt]')
        .between([roleId, Dexie.minKey], [roleId, anchor], true, false)
        .reverse()
        .limit(limit)
        .toArray();
}

async function queryNewerMessagesFromTable(
    table: typeof hotMessages,
    roleId: number,
    anchor: Date,
    limit: number,
) {
    return table
        .where('[roleId+createdAt]')
        .between([roleId, anchor], [roleId, Dexie.maxKey], false, true)
        .limit(limit)
        .toArray();
}

async function fetchLatestWindowFromTables(roleId: number, limit: number) {
    const queryLimit = limit + 1;
    const [hotList, coldList] = await Promise.all([
        queryLatestMessagesFromTable(hotMessages, roleId, queryLimit),
        queryLatestMessagesFromTable(coldMessages, roleId, queryLimit),
    ]);

    const merged = mergeAndTrimMessages([
        ...hotList,
        ...coldList,
    ], queryLimit);

    const messages = merged.slice(-limit);

    return {
        messages,
        hasOlder: merged.length > limit,
        hasNewer: false,
    };
}

async function fetchOlderWindowFromTables(roleId: number, anchor: Date, limit: number) {
    const queryLimit = limit + 1;
    const [hotList, coldList] = await Promise.all([
        queryOlderMessagesFromTable(hotMessages, roleId, anchor, queryLimit),
        queryOlderMessagesFromTable(coldMessages, roleId, anchor, queryLimit),
    ]);

    const merged = mergeAndTrimMessages([
        ...hotList,
        ...coldList,
    ], queryLimit);

    return {
        messages: merged.slice(-limit),
        hasOlder: merged.length > limit,
    };
}

async function fetchNewerWindowFromTables(roleId: number, anchor: Date, limit: number) {
    const queryLimit = limit + 1;
    const [hotList, coldList] = await Promise.all([
        queryNewerMessagesFromTable(hotMessages, roleId, anchor, queryLimit),
        queryNewerMessagesFromTable(coldMessages, roleId, anchor, queryLimit),
    ]);

    const merged = mergeAndTrimMessages([
        ...hotList,
        ...coldList,
    ], queryLimit);

    return {
        messages: merged.slice(0, limit),
        hasNewer: merged.length > limit,
    };
}

async function fetchLatestMessageForRole(roleId: number) {
    const { messages } = await fetchLatestWindowFromTables(roleId, 1);
    return messages[0] ?? null;
}

async function fetchRecentChatHistory(roleId: number, limit: number) {
    const queryLimit = limit + 1;
    const [hotList, coldList] = await Promise.all([
        queryLatestMessagesFromTable(hotMessages, roleId, queryLimit),
        queryLatestMessagesFromTable(coldMessages, roleId, queryLimit),
    ]);

    const merged = mergeAndTrimMessages([
        ...hotList,
        ...coldList,
    ], queryLimit);

    return merged.slice(-limit);
}

function buildWindowState(hasOlder: boolean, hasNewer: boolean): RoleWindowState {
    return {
        hasOlder,
        hasNewer,
    };
}

function toChatMessagesForLlm(list: ChatTableMessage[]) {
    const mapped = list
        .filter((item) => item.type === 'user' || item.type === 'assistant')
        .map((item): ChatMessage => {
            return {
                id: item.uuid,
                role: item.type,
                content: item.content,
                createdAt: toTimestamp(item.createdAt),
            };
        });

    return mapped;
}

function normalizePreview(content: string) {
    const trimmed = content.replace(/\s+/g, ' ').trim();
    if (trimmed === '') {
        return '暂无消息';
    }
    return trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed;
}

export const useChatStore = defineStore('chat', () => {
    const activeRoleId = ref<number | null>(null);
    const roleMessagesMap = ref<Record<number, ChatTableMessage[]>>({});
    const roleWindowStateMap = ref<Record<number, RoleWindowState>>({});
    const roleSummaryMap = ref<Record<number, RoleSummary>>({});
    const loadingRoleId = ref<number | null>(null);
    const errorMessage = ref('');

    const isLoading = computed(() => loadingRoleId.value !== null);

    let initializePromise: Promise<void> | null = null;

    function setRoleMessages(roleId: number, list: ChatTableMessage[]) {
        roleMessagesMap.value = {
            ...roleMessagesMap.value,
            [roleId]: sortMessagesAsc(list),
        };
    }

    function setRoleWindowState(roleId: number, state: RoleWindowState) {
        roleWindowStateMap.value = {
            ...roleWindowStateMap.value,
            [roleId]: state,
        };
    }

    function getRoleWindowState(roleId: number) {
        return roleWindowStateMap.value[roleId] ?? {
            hasOlder: false,
            hasNewer: false,
        };
    }

    async function refreshRoleSummary(roleId: number) {
        const latest = await fetchLatestMessageForRole(roleId);

        roleSummaryMap.value = {
            ...roleSummaryMap.value,
            [roleId]: {
                roleId,
                lastMessage: latest ? normalizePreview(latest.content) : '暂无消息',
                updatedAt: latest?.createdAt ?? null,
                total: 0,
            },
        };
    }

    async function compactHotMessagesOnStartup() {
        const allHot = await hotMessages.toArray();
        const roleGrouped = new Map<number, ChatTableMessage[]>();

        for (const message of allHot) {
            const group = roleGrouped.get(message.roleId) ?? [];
            group.push(message);
            roleGrouped.set(message.roleId, group);
        }

        const toMove: ChatTableMessage[] = [];

        for (const grouped of roleGrouped.values()) {
            const sortedDesc = [...grouped].sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
            const overflow = sortedDesc.slice(HOT_KEEP_COUNT);
            if (overflow.length > 0) {
                toMove.push(...overflow);
            }
        }

        if (toMove.length === 0) {
            return;
        }

        await hotMessages.db.transaction('rw', hotMessages, coldMessages, async () => {
            await coldMessages.bulkPut(toMove);
            await hotMessages.bulkDelete(toMove.map((item) => item.uuid));
        });
    }

    async function initialize() {
        if (initializePromise) {
            return initializePromise;
        }

        initializePromise = (async () => {
            await compactHotMessagesOnStartup();
        })();

        return initializePromise;
    }

    async function loadRoleMessages(roleId: number) {
        await initialize();

        const { messages, hasOlder, hasNewer } = await fetchLatestWindowFromTables(roleId, WINDOW_SIZE);
        setRoleMessages(roleId, messages);
        setRoleWindowState(roleId, buildWindowState(hasOlder, hasNewer));
        await refreshRoleSummary(roleId);
        return messages;
    }

    async function loadOlderMessages(roleId: number) {
        await initialize();

        const current = roleMessagesMap.value[roleId] ?? [];
        if (current.length === 0) {
            return false;
        }

        const anchor = current[0]?.createdAt;
        if (!anchor) {
            return false;
        }

        const { messages, hasOlder } = await fetchOlderWindowFromTables(roleId, anchor, WINDOW_STEP);
        if (messages.length === 0) {
            setRoleWindowState(roleId, {
                hasOlder: false,
                hasNewer: getRoleWindowState(roleId).hasNewer,
            });
            return false;
        }

        const nextMessages = sortMessagesAsc([
            ...messages,
            ...current.slice(0, OVERLAP_SIZE),
        ]);

        setRoleMessages(roleId, nextMessages);
        setRoleWindowState(roleId, buildWindowState(hasOlder, true));
        return true;
    }

    async function loadNewerMessages(roleId: number) {
        await initialize();

        const current = roleMessagesMap.value[roleId] ?? [];
        if (current.length === 0) {
            return false;
        }

        const anchor = current[current.length - 1]?.createdAt;
        if (!anchor) {
            return false;
        }

        const { messages, hasNewer } = await fetchNewerWindowFromTables(roleId, anchor, WINDOW_STEP);
        if (messages.length === 0) {
            setRoleWindowState(roleId, {
                hasOlder: getRoleWindowState(roleId).hasOlder,
                hasNewer: false,
            });
            return false;
        }

        const nextMessages = sortMessagesAsc([
            ...current.slice(-OVERLAP_SIZE),
            ...messages,
        ]);

        setRoleMessages(roleId, nextMessages);
        setRoleWindowState(roleId, buildWindowState(true, hasNewer));
        return true;
    }

    async function refreshRoleSummaries(roleIds: number[]) {
        await initialize();

        await Promise.all(
            roleIds.map(async (roleId) => {
                await refreshRoleSummary(roleId);
            }),
        );
    }

    function getRoleMessages(roleId: number) {
        return roleMessagesMap.value[roleId] ?? [];
    }

    function getRoleSummary(roleId: number) {
        return roleSummaryMap.value[roleId] ?? {
            roleId,
            lastMessage: '暂无消息',
            updatedAt: null,
            total: 0,
        };
    }

    async function openRole(roleId: number) {
        activeRoleId.value = roleId;
        errorMessage.value = '';
        await loadRoleMessages(roleId);
    }

    async function sendMessage(roleId: number, content: string, onToken?: (content: string) => void) {
        const question = content.trim();
        if (question === '' || isLoading.value) {
            return;
        }

        await initialize();

        const role = await roles.get(roleId);
        if (!role) {
            throw new Error('角色不存在，请先创建角色。');
        }

        const api = await apis.get(role.apiId);
        if (!api) {
            throw new Error('当前角色未绑定可用接口，请先在角色设置中选择接口。');
        }

        if (!(roleId in roleMessagesMap.value)) {
            await loadRoleMessages(roleId);
        }

        const current = [
            ...(roleMessagesMap.value[roleId] ?? []),
        ];

        const currentWindowState = getRoleWindowState(roleId);

        const now = new Date();
        const userMessage: ChatTableMessage = {
            uuid: generateUuid('user'),
            roleId,
            content: question,
            type: 'user',
            createdAt: now,
        };

        const assistantMessage: ChatTableMessage = {
            uuid: generateUuid('assistant'),
            roleId,
            content: '',
            type: 'assistant',
            createdAt: new Date(now.getTime() + 1),
        };

        current.push(userMessage);
        current.push(assistantMessage);

        if (!currentWindowState.hasNewer) {
            setRoleMessages(roleId, current);
        }

        await hotMessages.bulkPut([
            userMessage,
            assistantMessage,
        ]);

        const contextLimit = Number.isFinite(role.contextLimit) && role.contextLimit > 0
            ? Math.floor(role.contextLimit)
            : DEFAULT_CONTEXT_LIMIT;

        const history = await fetchRecentChatHistory(roleId, contextLimit);
        const llmHistory = toChatMessagesForLlm(history);

        const runtimeSettings: LlmRuntimeSettings = {
            apiKey: api.key,
            baseUrl: api.url,
            model: api.model,
            temperature: role.temperature,
            systemPrompt: role.prompts,
            outputLimit: role.outputLimit,
        };

        loadingRoleId.value = roleId;
        errorMessage.value = '';

        let flushTimer: ReturnType<typeof setTimeout> | null = null;

        const flushAssistantToDb = async () => {
            await hotMessages.update(assistantMessage.uuid, {
                content: assistantMessage.content,
            });
        };

        try {
            const finalAnswer = await streamAssistant(runtimeSettings, llmHistory, (token) => {
                assistantMessage.content += token;

                if (!currentWindowState.hasNewer) {
                    setRoleMessages(roleId, current);
                }
                if (onToken) {
                    onToken(assistantMessage.content);
                }

                if (flushTimer !== null) {
                    return;
                }

                flushTimer = setTimeout(() => {
                    flushTimer = null;
                    void flushAssistantToDb();
                }, 120);
            });

            assistantMessage.content = finalAnswer;
            if (!currentWindowState.hasNewer) {
                setRoleMessages(roleId, current);
            }
            await flushAssistantToDb();
        } catch (error) {
            if (assistantMessage.content.trim() === '') {
                assistantMessage.content = '(未收到有效响应)';
                if (!currentWindowState.hasNewer) {
                    setRoleMessages(roleId, current);
                }
                await hotMessages.update(assistantMessage.uuid, {
                    content: assistantMessage.content,
                });
            }

            errorMessage.value = error instanceof Error ? error.message : '请求失败，请稍后再试。';
        } finally {
            if (flushTimer !== null) {
                clearTimeout(flushTimer);
                flushTimer = null;
            }
            loadingRoleId.value = null;
            await refreshRoleSummary(roleId);
        }
    }

    return {
        activeRoleId,
        isLoading,
        errorMessage,
        initialize,
        openRole,
        loadRoleMessages,
        loadOlderMessages,
        loadNewerMessages,
        canLoadOlder: (roleId: number) => getRoleWindowState(roleId).hasOlder,
        canLoadNewer: (roleId: number) => getRoleWindowState(roleId).hasNewer,
        refreshRoleSummaries,
        getRoleMessages,
        getRoleSummary,
        sendMessage,
    };
});
