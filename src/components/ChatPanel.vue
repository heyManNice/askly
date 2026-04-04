<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { useChatStore } from "../stores/chat";
import { useSettingsStore } from "../stores/settings";

const chatStore = useChatStore();
const settingsStore = useSettingsStore();

const draft = ref("");
const messagesEl = ref<HTMLElement | null>(null);
const scrollRafId = ref<number | null>(null);

const activeConversation = computed(() => chatStore.activeConversation);

const md = new MarkdownIt({
    breaks: true,
    linkify: true,
    html: false,
});

function renderMarkdown(content: string) {
    const rawHtml = md.render(content);
    return DOMPurify.sanitize(rawHtml);
}

function handleSubmit() {
    const value = draft.value.trim();
    if (!value || chatStore.isLoading) {
        return;
    }
    draft.value = "";
    void chatStore.sendMessage(value);
}

function handleComposerEnter(event: KeyboardEvent) {
    if (event.isComposing || event.shiftKey) {
        return;
    }
    event.preventDefault();
    if (!chatStore.isLoading && draft.value.trim()) {
        handleSubmit();
    }
}

function scrollMessagesToBottom() {
    const container = messagesEl.value;
    if (!container) {
        return;
    }
    container.scrollTop = container.scrollHeight;
}

function startStreamAutoScroll() {
    if (scrollRafId.value !== null) {
        return;
    }

    const tick = () => {
        scrollMessagesToBottom();
        scrollRafId.value = window.requestAnimationFrame(tick);
    };

    scrollRafId.value = window.requestAnimationFrame(tick);
}

function stopStreamAutoScroll() {
    if (scrollRafId.value === null) {
        return;
    }
    window.cancelAnimationFrame(scrollRafId.value);
    scrollRafId.value = null;
}

watch(
    () => activeConversation.value?.messages.length ?? 0,
    async () => {
        await nextTick();
        scrollMessagesToBottom();
    },
);

watch(
    () => activeConversation.value?.id,
    async () => {
        await nextTick();
        scrollMessagesToBottom();
    },
    { immediate: true },
);

watch(
    () => chatStore.isLoading,
    async (loading) => {
        await nextTick();
        if (loading) {
            startStreamAutoScroll();
            return;
        }
        stopStreamAutoScroll();
        scrollMessagesToBottom();
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    stopStreamAutoScroll();
});
</script>

<template>
    <main class="chat-panel">
        <header class="chat-header">
            <h2>{{ activeConversation?.title || "新对话" }}</h2>
            <p>模型: {{ settingsStore.settings.model }} · {{ settingsStore.settings.baseUrl }}</p>
        </header>

        <section ref="messagesEl" class="messages">
            <div v-if="!activeConversation?.messages.length" class="empty-state">
                <p>开始你的第一个问题吧。</p>
                <p class="sub">左侧可以管理会话，设置里填写 API Key 后即可发问。</p>
            </div>

            <article v-for="message in activeConversation?.messages || []" :key="message.id" class="message"
                :class="message.role">
                <div class="role">{{ message.role === "user" ? "你" : "助手" }}</div>
                <div class="content markdown-body" v-html="renderMarkdown(message.content)" />
            </article>
        </section>

        <form class="composer" @submit.prevent="handleSubmit">
            <p v-if="chatStore.errorMessage" class="error-line">{{ chatStore.errorMessage }}</p>
            <textarea v-model="draft"
                :placeholder="chatStore.isLoading ? '思考中...' : '输入你的问题，按 Enter 发送，Shift + Enter 换行。'" rows="3"
                :disabled="chatStore.isLoading" @keydown.enter="handleComposerEnter" />
        </form>
    </main>
</template>

<style scoped>
.chat-panel {
    border: 1px solid var(--line);
    background: var(--panel);
    backdrop-filter: blur(8px);
    border-radius: 18px;
    box-shadow: var(--shadow);
    display: grid;
    grid-template-rows: auto 1fr auto;
    padding: 20px;
    gap: 14px;
    min-height: 0;
    overflow: hidden;
}

.chat-header h2 {
    margin: 0;
    font-size: 20px;
}

.chat-header p {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--text-sub);
}

.messages {
    overflow: auto;
    padding-right: 4px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    user-select: text;
    overflow-x: hidden;
}

.empty-state {
    border: 1px dashed var(--line);
    border-radius: 14px;
    padding: 18px;
    color: var(--text-sub);
}

.empty-state .sub {
    margin-top: 6px;
    font-size: 13px;
}

.message {
    max-width: 86%;
    padding: 12px;
    border-radius: 14px;
    border: 1px solid var(--line);
}

.message.user {
    align-self: flex-end;
    background: var(--accent-soft);
    border-color: var(--line-strong);
}

.message.assistant {
    align-self: flex-start;
    background: var(--surface);
}

.role {
    font-size: 12px;
    color: var(--text-sub);
    margin-bottom: 6px;
}

.content {
    line-height: 1.55;
}

.markdown-body :deep(p),
.markdown-body :deep(ul),
.markdown-body :deep(ol),
.markdown-body :deep(pre),
.markdown-body :deep(blockquote),
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
    margin: 0;
}

.markdown-body :deep(p + p),
.markdown-body :deep(p + ul),
.markdown-body :deep(p + ol),
.markdown-body :deep(p + pre),
.markdown-body :deep(pre + p),
.markdown-body :deep(ul + p),
.markdown-body :deep(ol + p),
.markdown-body :deep(blockquote + p) {
    margin-top: 0.6em;
}

.markdown-body :deep(pre) {
    overflow-x: auto;
    background: var(--code-bg);
    color: var(--code-text);
    border-radius: 10px;
    border: 1px solid var(--line-strong);
    padding: 10px 12px;
}

.markdown-body :deep(code) {
    font-family: "Consolas", "SFMono-Regular", "Liberation Mono", monospace;
    font-size: 0.92em;
}

.markdown-body :deep(:not(pre) > code) {
    background: var(--inline-code-bg);
    color: var(--inline-code-text);
    border-radius: 6px;
    padding: 0.1em 0.35em;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
    padding-left: 1.2em;
}

.markdown-body :deep(blockquote) {
    padding-left: 0.8em;
    border-left: 3px solid var(--blockquote-line);
    color: var(--text-sub);
}

.markdown-body :deep(a) {
    color: var(--accent);
}

.error-line {
    margin: 0;
    color: var(--danger);
    font-size: 13px;
}

.composer {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
}

.composer textarea {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px 12px;
    font: inherit;
    color: var(--text-main);
    background: var(--surface);
    resize: none;
    outline: none;
}

.composer textarea:focus {
    border-color: var(--accent);
    box-shadow: var(--focus-ring);
}
</style>
