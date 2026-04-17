import {
    defineStore
} from 'pinia';

import {
    computed,
    ref
} from 'vue';

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

async function fetchRoleMessagesFromTables(roleId: number) {
    const [hotList, coldList] = await Promise.all([
        hotMessages.where('roleId').equals(roleId).toArray(),
        coldMessages.where('roleId').equals(roleId).toArray(),
    ]);

    return sortMessagesAsc([
        ...coldList,
        ...hotList,
    ]);
}

export const useChatStore = defineStore('chat', () => {
    const activeRoleId = ref<number | null>(null);
    const roleMessagesMap = ref<Record<number, ChatTableMessage[]>>({});
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
        updateRoleSummary(roleId);
    }

    function updateRoleSummary(roleId: number) {
        const list = roleMessagesMap.value[roleId] ?? [];
        const last = list.length > 0 ? list[list.length - 1] : null;

        roleSummaryMap.value = {
            ...roleSummaryMap.value,
            [roleId]: {
                roleId,
                lastMessage: last ? normalizePreview(last.content) : '暂无消息',
                updatedAt: last?.createdAt ?? null,
                total: list.length,
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
        const list = await fetchRoleMessagesFromTables(roleId);
        setRoleMessages(roleId, list);
        return list;
    }

    async function refreshRoleSummaries(roleIds: number[]) {
        await initialize();

        await Promise.all(
            roleIds.map(async (roleId) => {
                const list = await fetchRoleMessagesFromTables(roleId);
                setRoleMessages(roleId, list);
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
        setRoleMessages(roleId, current);

        await hotMessages.bulkPut([
            userMessage,
            assistantMessage,
        ]);

        const history = toChatMessagesForLlm(current.filter((item) => item.uuid !== assistantMessage.uuid));
        const contextLimit = Number.isFinite(role.contextLimit) && role.contextLimit > 0
            ? Math.floor(role.contextLimit)
            : history.length;

        const llmHistory = contextLimit > 0 ? history.slice(-contextLimit) : history;

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

                setRoleMessages(roleId, current);
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
            setRoleMessages(roleId, current);
            await flushAssistantToDb();
        } catch (error) {
            if (assistantMessage.content.trim() === '') {
                assistantMessage.content = '(未收到有效响应)';
                setRoleMessages(roleId, current);
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
            updateRoleSummary(roleId);
        }
    }

    return {
        activeRoleId,
        isLoading,
        errorMessage,
        initialize,
        openRole,
        loadRoleMessages,
        refreshRoleSummaries,
        getRoleMessages,
        getRoleSummary,
        sendMessage,
    };
});
