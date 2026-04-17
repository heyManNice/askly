<template>
    <n class="flex flex-col h-full bg-white dark:bg-black">
        <!-- 顶部标题栏 -->
        <n @mousedown="handleMouseDown" class="flex flex-row px-2 pb-2 border-b dark:border-zinc-900 border-gray-200">
            <!-- 左边返回图标 -->
            <FiChevronLeft @mousedown.stop @click="pageStack.pop()"
                class="w-5 cursor-pointer hover:bg-gray-100 dark:border-zinc-900 dark:hover:bg-zinc-800 rounded block md:hidden max-sm:mr-5" />

            <!-- 标题内容 -->
            <n class="mr-auto ml-auto md:ml-0 truncate">{{ activeRole?.name || '会话' }}</n>

            <!-- 会话操作按钮 -->
            <n @mousedown.stop class="mr-2 flex gap-2">
                <!-- 固定在顶层 -->
                <n :title="pinStore.isPinned ? '取消固定' : '固定在顶层'">
                    <VscPin class="w-5 cursor-pointer hover:bg-gray-100 rounded dark:hover:bg-zinc-800" :class="{
                        '-rotate-45 text-blue-500': pinStore.isPinned
                    }" @click="pinStore.togglePin()" />
                </n>

                <!-- 更多选项 -->
                <n title="更多">
                    <FiMoreHorizontal class="w-5 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 rounded" />
                </n>
            </n>
        </n>

        <!-- 会话消息区 -->
        <n ref="messageContainerRef" class="flex-1 overflow-y-auto px-2 py-2" @scroll="onMessageScroll">
            <n v-if="visibleMessages.length === 0" class="text-sm text-gray-500 dark:text-zinc-400 px-1 py-2">
                暂无消息，发送第一条开始对话。
            </n>

            <n v-for="message in visibleMessages" :key="message.uuid" class="mb-2 flex" :class="{
                'justify-end': message.type === 'user',
                'justify-start': message.type !== 'user',
            }">
                <!-- 消息气泡 -->
                <n class="max-w-[90%] rounded px-3 py-2 text-sm leading-6 select-text" :class="{
                    'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900': message.type === 'user',
                    'bg-gray-100 text-gray-900 dark:bg-zinc-800 dark:text-zinc-100': message.type !== 'user',
                }">
                    <!-- 使用自定义 diff-html 指令进行流式增量渲染 -->
                    <n class="diff-html-content" v-diff-html="renderMessageHtml(message.content)"></n>
                </n>
            </n>

            <n v-if="chatStore.isLoading" class="text-xs text-gray-500 dark:text-zinc-400 px-1 py-1">
                正在生成中...
            </n>
            <n v-if="chatStore.errorMessage" class="text-xs text-red-500 px-1 py-1">
                {{ chatStore.errorMessage }}
            </n>
        </n>

        <!-- 输入框 -->
        <n class="h-40 flex flex-col shrink-0 border-t dark:border-zinc-900 border-gray-200 px-2 py-1 gap-1">
            <!-- 输入框富文本选项 -->
            <n class="flex flex-row gap-2">
                <n v-for="btn in mediaButtons" :key="btn.label" :title="btn.label">
                    <component :is="btn.icon"
                        class="w-5 h-5 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 rounded" />
                </n>
            </n>

            <!-- 文字输入框 -->
            <textarea v-model="inputValue" @keydown="onInputKeydown" class="flex-1 resize-none"
                placeholder="按 Enter 发送，按 Shift + Enter 换行"></textarea>
        </n>
    </n>
</template>

<script lang="ts" setup>
import windowm from '@eziapp-org/bridge/windowm';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

import {
    computed,
    nextTick,
    ref,
    watch
} from 'vue';

import {
    FiMoreHorizontal,
    FiFolder,
    FiImage,
    FiChevronLeft
} from 'vue-icons-plus/fi';

import {
    VscPin
} from 'vue-icons-plus/vsc';

import {
    usePageStackStore
} from '@stores/pageStack';

import {
    usePinStore
} from '@stores/pin';

import {
    useRolesStore
} from '@stores/roles';

import {
    useChatStore
} from '@stores/chat';

const pageStack = usePageStackStore();
const pinStore = usePinStore();
const rolesStore = useRolesStore();
const chatStore = useChatStore();

const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
});

type MediaButton = {
    icon: typeof FiFolder;
    label: string;
};

const mediaButtons: MediaButton[] = [
    {
        icon: FiFolder,
        label: '文件'
    },
    {
        icon: FiImage,
        label: '图片'
    }
];

const PAGE_SIZE = 10;
const MAX_DOM_COUNT = 20;

const inputValue = ref('');
const messageContainerRef = ref<HTMLElement | null>(null);

const windowStart = ref(0);
const windowEnd = ref(0);

const activeRole = computed(() => {
    const roleId = chatStore.activeRoleId;
    if (!roleId) {
        return null;
    }

    return rolesStore.roleList.find((role) => role.id === roleId) ?? null;
});

const allMessages = computed(() => {
    const roleId = chatStore.activeRoleId;
    if (!roleId) {
        return [];
    }

    return chatStore.getRoleMessages(roleId);
});

const visibleMessages = computed(() => {
    const end = Math.min(windowEnd.value, allMessages.value.length);
    const start = Math.max(0, Math.min(windowStart.value, end));
    return allMessages.value.slice(start, end);
});

function renderMessageHtml(content: string) {
    const unsafeHtml = md.render(content || '');
    return DOMPurify.sanitize(unsafeHtml);
}

function isNearBottom() {
    const container = messageContainerRef.value;
    if (!container) {
        return true;
    }

    const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
    return remaining < 24;
}

async function scrollToBottom() {
    await nextTick();
    const container = messageContainerRef.value;
    if (!container) {
        return;
    }

    container.scrollTop = container.scrollHeight;
}

function resetWindowToLatest() {
    const total = allMessages.value.length;
    windowEnd.value = total;
    windowStart.value = Math.max(0, total - PAGE_SIZE);
}

function trimWindowToLatest(preferredCount = PAGE_SIZE) {
    const total = allMessages.value.length;
    windowEnd.value = total;
    windowStart.value = Math.max(0, total - preferredCount);
}

async function loadOlderChunk() {
    const container = messageContainerRef.value;
    if (!container || windowStart.value <= 0) {
        return;
    }

    const prevHeight = container.scrollHeight;
    const prevTop = container.scrollTop;

    const nextStart = Math.max(0, windowStart.value - PAGE_SIZE);
    windowStart.value = nextStart;

    if (windowEnd.value - windowStart.value > MAX_DOM_COUNT) {
        windowEnd.value = windowStart.value + MAX_DOM_COUNT;
    }

    await nextTick();

    const nextHeight = container.scrollHeight;
    container.scrollTop = prevTop + (nextHeight - prevHeight);
}

async function loadNewerChunk() {
    const container = messageContainerRef.value;
    if (!container || windowEnd.value >= allMessages.value.length) {
        return;
    }

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

    windowEnd.value = Math.min(allMessages.value.length, windowEnd.value + PAGE_SIZE);

    if (windowEnd.value - windowStart.value > MAX_DOM_COUNT) {
        windowStart.value = Math.max(0, windowEnd.value - MAX_DOM_COUNT);
    }

    await nextTick();

    const nextTop = container.scrollHeight - container.clientHeight - distanceFromBottom;
    container.scrollTop = Math.max(0, nextTop);
}

function onMessageScroll() {
    const container = messageContainerRef.value;
    if (!container) {
        return;
    }

    if (container.scrollTop <= 20) {
        void loadOlderChunk();
        return;
    }

    const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (remaining <= 20) {
        // 回到底部时，主动收缩为最新窗口，避免 DOM 长时间保持较大切片
        if (windowEnd.value >= allMessages.value.length) {
            if (windowEnd.value - windowStart.value > PAGE_SIZE) {
                trimWindowToLatest(PAGE_SIZE);
                void scrollToBottom();
            }
            return;
        }

        void loadNewerChunk();
    }
}

function onInputKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey) {
        return;
    }

    event.preventDefault();
    void sendCurrentInput();
}

async function sendCurrentInput() {
    const roleId = chatStore.activeRoleId;
    if (!roleId) {
        return;
    }

    const text = inputValue.value.trim();
    if (text === '' || chatStore.isLoading) {
        return;
    }

    inputValue.value = '';
    const shouldStick = isNearBottom();

    await chatStore.sendMessage(roleId, text, () => {
        if (shouldStick) {
            trimWindowToLatest(PAGE_SIZE);
            void scrollToBottom();
        }
    });

    // 新消息返回后保持仅渲染最新窗口，防止 DOM 持续增长
    trimWindowToLatest(PAGE_SIZE);

    if (shouldStick) {
        await scrollToBottom();
    }
}

watch(
    () => chatStore.activeRoleId,
    async (roleId) => {
        if (!roleId) {
            return;
        }

        await chatStore.loadRoleMessages(roleId);
        resetWindowToLatest();
        await scrollToBottom();
    },
    { immediate: true }
);

watch(
    () => allMessages.value.length,
    async (nextLength, prevLength) => {
        if (windowEnd.value === 0 && allMessages.value.length > 0) {
            resetWindowToLatest();
            await scrollToBottom();
            return;
        }

        // 始终确保消息窗口不会超过上限
        if (windowEnd.value - windowStart.value > MAX_DOM_COUNT) {
            windowStart.value = Math.max(0, windowEnd.value - MAX_DOM_COUNT);
        }

        const hasNewMessage = nextLength > prevLength;
        if (hasNewMessage) {
            // AI/用户新增消息后，如果当前在底部附近，直接切回最新几条
            if (isNearBottom()) {
                trimWindowToLatest(PAGE_SIZE);
                await scrollToBottom();
                return;
            }
        }

        if (isNearBottom()) {
            trimWindowToLatest(PAGE_SIZE);
            await scrollToBottom();
        }
    }
);

// 鼠标左键拖动标题栏
function handleMouseDown(event: MouseEvent) {
    if (event.button === 0) {
        windowm.getCurrentWindow()
            .then(win => {
                win.drag();
            });
    }
}
</script>

<style scoped>
:deep(.diff-html-content pre) {
    overflow-x: auto;
}

:deep(.diff-html-content p) {
    margin: 0.25rem 0;
}
</style>
