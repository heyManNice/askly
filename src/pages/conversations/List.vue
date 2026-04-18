<template>
    <n class="flex flex-col h-full gap-2 bg-white dark:bg-black">
        <!-- 搜索区域 -->
        <n class="h-8 flex shrink-0 px-2">
            <!-- 搜索输入框 -->
            <input v-model="keyword"
                class="flex-1 px-2 min-w-1 bg-gray-100 dark:bg-zinc-800 dark:border-zinc-900 rounded" type="text"
                placeholder="搜索角色">
        </n>

        <!-- 会话列表区域（按角色） -->
        <n class="flex-1 flex flex-col gap-2 overflow-y-auto px-2">
            <n v-if="filteredRoles.length === 0"
                class="text-sm text-gray-500 dark:text-zinc-400 rounded bg-gray-50 dark:bg-zinc-900 p-3">
                无会话
            </n>

            <n v-for="role in filteredRoles" :key="role.id" @click="openRoleChat(role.id)"
                class="flex items-center rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 gap-2" :class="{
                    'bg-gray-100 dark:bg-zinc-800': chatStore.activeRoleId === role.id,
                }">
                <!-- 头像 -->
                <n v-if="getRoleAvatarUrl(role.id)" class="w-10 h-10 rounded overflow-hidden shrink-0">
                    <img class="w-10 h-10 rounded object-cover" :src="getRoleAvatarUrl(role.id)" alt="avatar">
                </n>
                <n v-else
                    class="w-10 h-10 rounded shrink-0 bg-gray-200 dark:bg-zinc-700 text-sm flex items-center justify-center">
                    {{ role.name.slice(0, 1) || '角' }}
                </n>

                <!-- 右边的文字 -->
                <n class="flex flex-col flex-1 overflow-hidden">
                    <n class="flex items-center gap-2">
                        <!-- 标题 -->
                        <n class="font-medium mr-auto truncate">
                            {{ role.name || '未命名角色' }}
                        </n>

                        <!-- 时间 -->
                        <n class="text-xs text-gray-500">
                            {{ formatSummaryTime(role.id) }}
                        </n>
                    </n>

                    <!-- 详细内容 -->
                    <n class="text-sm text-gray-500 truncate">
                        {{ getSummaryText(role.id) }}
                    </n>
                </n>
            </n>
        </n>

        <mobile-nav />
    </n>
</template>

<script lang="ts" setup>
import {
    computed,
    onBeforeUnmount,
    ref,
    watch
} from 'vue';

import Chat from '@pages/conversations/Chat.vue';
import MobileNav from '@components/MobileNav.vue';

import {
    usePageStackStore
} from '@stores/pageStack';

import {
    usePufferStore
} from '@stores/puffer';

import {
    useRolesStore
} from '@stores/roles';

import {
    useChatStore
} from '@stores/chat';

const pageStack = usePageStackStore();
const pufferStore = usePufferStore();
const rolesStore = useRolesStore();
const chatStore = useChatStore();

const keyword = ref('');
const avatarUrlMap = ref<Record<number, string>>({});

const sortedRoles = computed(() => {
    return [...rolesStore.roleList].sort((a, b) => {
        const timeA = a.id ? (chatStore.getRoleSummary(a.id).updatedAt?.getTime() ?? 0) : 0;
        const timeB = b.id ? (chatStore.getRoleSummary(b.id).updatedAt?.getTime() ?? 0) : 0;
        return timeB - timeA;
    });
});

const filteredRoles = computed(() => {
    const q = keyword.value.trim().toLowerCase();
    if (q === '') {
        return sortedRoles.value;
    }

    return sortedRoles.value.filter((role) => {
        return role.name.toLowerCase().includes(q) || role.description.toLowerCase().includes(q);
    });
});

function revokeAvatarUrls() {
    for (const url of Object.values(avatarUrlMap.value)) {
        URL.revokeObjectURL(url);
    }
    avatarUrlMap.value = {};
}

function rebuildAvatarUrls() {
    revokeAvatarUrls();

    const nextMap: Record<number, string> = {};
    for (const role of rolesStore.roleList) {
        if (!role.id) {
            continue;
        }

        if (role.avatar.size > 0) {
            nextMap[role.id] = URL.createObjectURL(role.avatar);
        }
    }

    avatarUrlMap.value = nextMap;
}

function getRoleAvatarUrl(roleId?: number) {
    if (!roleId) {
        return '';
    }
    return avatarUrlMap.value[roleId] ?? '';
}

function formatSummaryTime(roleId?: number) {
    if (!roleId) {
        return '';
    }

    const updatedAt = chatStore.getRoleSummary(roleId).updatedAt;
    if (!updatedAt) {
        return '';
    }

    const now = new Date();

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetStart = new Date(updatedAt.getFullYear(), updatedAt.getMonth(), updatedAt.getDate());
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((todayStart.getTime() - targetStart.getTime()) / msPerDay);

    if (diffDays === 0) {
        return updatedAt.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    }

    if (diffDays === 1) {
        return '昨天';
    }

    if (updatedAt.getFullYear() === now.getFullYear()) {
        const month = `${updatedAt.getMonth() + 1}`.padStart(2, '0');
        const day = `${updatedAt.getDate()}`.padStart(2, '0');
        return `${month}-${day}`;
    }

    return `${updatedAt.getFullYear()}`;
}

function getSummaryText(roleId?: number) {
    if (!roleId) {
        return '暂无消息';
    }

    return chatStore.getRoleSummary(roleId).lastMessage;
}

async function openRoleChat(roleId?: number) {
    if (!roleId) {
        return;
    }

    await chatStore.openRole(roleId);
    pageStack.push(Chat);
}

async function initializeConversations() {
    await rolesStore.refreshRoles();
    await chatStore.initialize();

    const roleIds = rolesStore.roleList
        .map((role) => role.id)
        .filter((id): id is number => typeof id === 'number');

    await chatStore.refreshRoleSummaries(roleIds);
    rebuildAvatarUrls();

    const firstRoleId = sortedRoles.value[0]?.id;
    if (typeof firstRoleId === 'number' && chatStore.activeRoleId === null) {
        await chatStore.openRole(firstRoleId);
    }

    // 如果切换到电脑模式并且页面栈只有一个页面，就压入聊天页
    if (pufferStore.morph === 'expanded' && pageStack.stack.length === 1 && roleIds.length > 0) {
        pageStack.push(Chat);
    }
}

void initializeConversations();

watch(
    () => rolesStore.roleList,
    (list) => {
        const roleIds = list
            .map((role) => role.id)
            .filter((id): id is number => typeof id === 'number');

        void chatStore.refreshRoleSummaries(roleIds);
        rebuildAvatarUrls();
    },
    { deep: true }
);

pufferStore.onResize(() => {
    const hasRoles = rolesStore.roleList.length > 0;
    if (pufferStore.morph === 'expanded' && pageStack.stack.length === 1 && hasRoles) {
        pageStack.push(Chat);
    }
});

onBeforeUnmount(() => {
    revokeAvatarUrls();
});
</script>
