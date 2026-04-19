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
        <n ref="messageContainerRef" class="flex-1 overflow-y-auto px-2 py-2" @wheel.passive="onMessageWheel"
            @scroll="onMessageScroll">
            <n v-if="visibleMessages.length === 0" class="text-sm text-gray-500 dark:text-zinc-400 px-1 py-2">
                暂无消息，发送第一条开始对话。
            </n>

            <n v-for="message in visibleMessages" :key="message.uuid" class="mb-2 flex" :class="{
                'justify-end': message.type === 'user',
                'justify-start': message.type !== 'user',
            }" :data-message-id="message.uuid">
                <!-- 消息气泡 -->
                <n
                    class="max-w-[90%] rounded px-3 py-2 text-sm leading-6 select-text bg-gray-50 text-gray-900 dark:bg-zinc-900 dark:text-zinc-200">
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

const CHUNK_SIZE = 20;
const OVERLAP_SIZE = 6;
const CHUNK_STEP = Math.max(1, CHUNK_SIZE - OVERLAP_SIZE);
const EDGE_TRIGGER_GAP = 20;
const SWITCH_COOLDOWN_MS = 160;

const inputValue = ref('');
const messageContainerRef = ref<HTMLElement | null>(null);

const windowStart = ref(0);
const isSwitchingChunk = ref(false);
const switchCooldownUntil = ref(0);
const lastScrollTop = ref(0);
const lastWheelDirection = ref<'up' | 'down' | ''>('');

type AnchorEdge = 'top' | 'bottom';

type ScrollAnchor = {
    messageId: string;
    edge: AnchorEdge;
    offset: number;
};

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
    const start = Math.max(0, Math.min(windowStart.value, allMessages.value.length));
    const end = Math.min(start + CHUNK_SIZE, allMessages.value.length);
    return allMessages.value.slice(start, end);
});

function getLatestWindowStart(total: number) {
    return Math.max(0, total - CHUNK_SIZE);
}

function isViewingLatestChunk() {
    return windowStart.value >= getLatestWindowStart(allMessages.value.length);
}

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
    return remaining <= EDGE_TRIGGER_GAP;
}

async function scrollToBottom() {
    await nextTick();
    const container = messageContainerRef.value;
    if (!container) {
        return;
    }

    container.scrollTop = container.scrollHeight;
    lastScrollTop.value = container.scrollTop;
}

function resetWindowToLatest() {
    windowStart.value = getLatestWindowStart(allMessages.value.length);
    switchCooldownUntil.value = Date.now() + SWITCH_COOLDOWN_MS;
    lastWheelDirection.value = '';
}

function getMessageElements() {
    const container = messageContainerRef.value;
    if (!container) {
        return [];
    }

    return Array.from(container.querySelectorAll<HTMLElement>('[data-message-id]'));
}

function captureScrollAnchor(edge: AnchorEdge): ScrollAnchor | null {
    const container = messageContainerRef.value;
    if (!container) {
        return null;
    }

    const elements = getMessageElements();
    if (elements.length === 0) {
        return null;
    }

    const containerRect = container.getBoundingClientRect();
    const visibleElements = elements.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.bottom > containerRect.top && rect.top < containerRect.bottom;
    });

    const source = visibleElements.length > 0 ? visibleElements : elements;
    const anchorElement = edge === 'top'
        ? source[0]
        : source[source.length - 1];
    const messageId = anchorElement.dataset.messageId;

    if (!messageId) {
        return null;
    }

    const rect = anchorElement.getBoundingClientRect();
    const offset = edge === 'top'
        ? rect.top - containerRect.top
        : containerRect.bottom - rect.bottom;

    return {
        messageId,
        edge,
        offset,
    };
}

function restoreScrollAnchor(anchor: ScrollAnchor) {
    const container = messageContainerRef.value;
    if (!container) {
        return false;
    }

    const anchorElement = getMessageElements().find((element) => {
        return element.dataset.messageId === anchor.messageId;
    });

    if (!anchorElement) {
        return false;
    }

    const containerRect = container.getBoundingClientRect();
    const rect = anchorElement.getBoundingClientRect();
    const currentOffset = anchor.edge === 'top'
        ? rect.top - containerRect.top
        : containerRect.bottom - rect.bottom;
    const delta = currentOffset - anchor.offset;

    if (anchor.edge === 'top') {
        container.scrollTop += delta;
    } else {
        container.scrollTop -= delta;
    }

    lastScrollTop.value = container.scrollTop;
    return true;
}

async function switchToOlderChunk() {
    const container = messageContainerRef.value;
    if (!container || windowStart.value <= 0 || isSwitchingChunk.value) {
        return;
    }

    const anchor = captureScrollAnchor('top');
    isSwitchingChunk.value = true;
    windowStart.value = Math.max(0, windowStart.value - CHUNK_STEP);

    try {
        await nextTick();
        const restored = anchor ? restoreScrollAnchor(anchor) : false;
        if (!restored) {
            const target = container.scrollHeight - container.clientHeight - EDGE_TRIGGER_GAP;
            container.scrollTop = Math.max(0, target);
            lastScrollTop.value = container.scrollTop;
        }
    } finally {
        isSwitchingChunk.value = false;
        switchCooldownUntil.value = Date.now() + SWITCH_COOLDOWN_MS;
        lastWheelDirection.value = '';
    }
}

async function switchToNewerChunk() {
    const container = messageContainerRef.value;
    if (!container || isSwitchingChunk.value) {
        return;
    }

    const nextStart = windowStart.value + CHUNK_STEP;
    if (nextStart >= allMessages.value.length) {
        return;
    }

    const anchor = captureScrollAnchor('bottom');
    isSwitchingChunk.value = true;
    windowStart.value = nextStart;

    try {
        await nextTick();
        const restored = anchor ? restoreScrollAnchor(anchor) : false;
        if (!restored) {
            const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
            container.scrollTop = Math.min(EDGE_TRIGGER_GAP, maxTop);
            lastScrollTop.value = container.scrollTop;
        }
    } finally {
        isSwitchingChunk.value = false;
        switchCooldownUntil.value = Date.now() + SWITCH_COOLDOWN_MS;
        lastWheelDirection.value = '';
    }
}

function onMessageWheel(event: WheelEvent) {
    if (event.deltaY < 0) {
        lastWheelDirection.value = 'up';
        return;
    }

    if (event.deltaY > 0) {
        lastWheelDirection.value = 'down';
    }
}

function onMessageScroll() {
    const container = messageContainerRef.value;
    if (!container || isSwitchingChunk.value) {
        return;
    }

    if (Date.now() < switchCooldownUntil.value) {
        lastScrollTop.value = container.scrollTop;
        return;
    }

    const currentTop = container.scrollTop;
    const isMovingUp = currentTop < lastScrollTop.value;
    const isMovingDown = currentTop > lastScrollTop.value;
    lastScrollTop.value = currentTop;

    const intendsUp = lastWheelDirection.value === 'up' || isMovingUp;
    const intendsDown = lastWheelDirection.value === 'down' || isMovingDown;

    const isAtTopEdge = currentTop <= EDGE_TRIGGER_GAP;
    const remaining = container.scrollHeight - currentTop - container.clientHeight;
    const isAtBottomEdge = remaining <= EDGE_TRIGGER_GAP;

    if (isAtTopEdge && windowStart.value > 0 && intendsUp) {
        void switchToOlderChunk();
        return;
    }

    if (isAtBottomEdge && intendsDown) {
        void switchToNewerChunk();
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
            resetWindowToLatest();
            void scrollToBottom();
        }
    });

    if (shouldStick) {
        resetWindowToLatest();
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
        if (nextLength === 0) {
            windowStart.value = 0;
            return;
        }

        if (prevLength === 0 && nextLength > 0) {
            resetWindowToLatest();
            await scrollToBottom();
            return;
        }

        if (windowStart.value >= nextLength) {
            resetWindowToLatest();
            await nextTick();
            return;
        }

        const hasNewMessage = nextLength > prevLength;
        if (hasNewMessage && isViewingLatestChunk() && isNearBottom()) {
            resetWindowToLatest();
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
