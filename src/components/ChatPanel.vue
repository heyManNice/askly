<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import MarkdownIt from "markdown-it";
import texmath from "markdown-it-texmath";
import katex from "katex";
import DOMPurify from "dompurify";
import { useChatStore } from "../stores/chat";
import { useSettingsStore } from "../stores/settings";

import "katex/dist/katex.min.css";

const chatStore = useChatStore();
const settingsStore = useSettingsStore();

const draft = ref("");
const messagesEl = ref<HTMLElement | null>(null);
const contextMenuEl = ref<HTMLElement | null>(null);
const scrollRafId = ref<number | null>(null);
const isAutoScrollEnabledForCurrentReply = ref(true);
const contextMenuOpen = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const selectedText = ref("");

const activeConversation = computed(() => chatStore.activeConversation);
const hasSelectedText = computed(() => selectedText.value.trim().length > 0);

const md = new MarkdownIt({
    breaks: true,
    linkify: true,
    html: false,
});

md.use(texmath, {
    engine: katex,
    delimiters: ["dollars", "brackets"],
});

function renderMarkdown(content: string) {
    const normalizedContent = normalizeMathEscaping(content);
    const rawHtml = md.render(normalizedContent);
    return DOMPurify.sanitize(rawHtml);
}

function normalizeMathEscaping(content: string) {
    // Some model outputs double-escape bracket delimiters, e.g. \\[ ... \\].
    // Reduce one escape layer inside those math blocks so texmath can parse them.
    return content
        .replace(/\\\\\[((?:.|\n)*?)\\\\\]/g, (_all, inner: string) => {
            return `\\[${inner.replace(/\\\\/g, "\\")}\\]`;
        })
        .replace(/\\\\\(((?:.|\n)*?)\\\\\)/g, (_all, inner: string) => {
            return `\\(${inner.replace(/\\\\/g, "\\")}\\)`;
        });
}

function markdownToPlainText(content: string) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = md.render(content);
    return (wrapper.textContent ?? "").trim();
}

function getConversationPlainText() {
    const conversation = activeConversation.value;
    if (!conversation) {
        return "";
    }

    return conversation.messages
        .map((message) => `${message.role === "user" ? "你" : "助手"}: ${markdownToPlainText(message.content)}`)
        .join("\n\n");
}

function getConversationMarkdownText() {
    const conversation = activeConversation.value;
    if (!conversation) {
        return "";
    }

    return conversation.messages
        .map((message) => `${message.role === "user" ? "### 你" : "### 助手"}\n\n${message.content}`)
        .join("\n\n---\n\n");
}

function getSelectedTextInMessages() {
    const container = messagesEl.value;
    const selection = window.getSelection();
    if (!container || !selection || selection.rangeCount === 0) {
        return "";
    }

    const text = selection.toString().trim();
    if (!text) {
        return "";
    }

    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;
    if ((anchorNode && container.contains(anchorNode)) || (focusNode && container.contains(focusNode))) {
        return text;
    }

    return "";
}

async function copyText(text: string) {
    if (!text) {
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        return;
    } catch {
        const fallback = document.createElement("textarea");
        fallback.value = text;
        fallback.setAttribute("readonly", "true");
        fallback.style.position = "fixed";
        fallback.style.left = "-9999px";
        document.body.appendChild(fallback);
        fallback.select();
        document.execCommand("copy");
        document.body.removeChild(fallback);
    }
}

function closeContextMenu() {
    contextMenuOpen.value = false;
}

async function openContextMenu(event: MouseEvent) {
    event.preventDefault();
    selectedText.value = getSelectedTextInMessages();
    contextMenuOpen.value = true;

    await nextTick();

    const container = messagesEl.value;
    const menu = contextMenuEl.value;
    if (!container || !menu) {
        return;
    }

    const containerRect = container.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const padding = 8;

    const nextX = event.clientX - containerRect.left + container.scrollLeft;
    const nextY = event.clientY - containerRect.top + container.scrollTop;

    const maxX = container.scrollLeft + container.clientWidth - menuRect.width - padding;
    const maxY = container.scrollTop + container.clientHeight - menuRect.height - padding;

    contextMenuX.value = Math.max(container.scrollLeft + padding, Math.min(nextX, maxX));
    contextMenuY.value = Math.max(container.scrollTop + padding, Math.min(nextY, maxY));
}

async function handleCopySelected() {
    await copyText(selectedText.value.trim());
    closeContextMenu();
}

async function handleCopyAll() {
    await copyText(getConversationPlainText());
    closeContextMenu();
}

async function handleCopyMarkdown() {
    await copyText(getConversationMarkdownText());
    closeContextMenu();
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

function smoothScrollStepToBottom() {
    const container = messagesEl.value;
    if (!container) {
        return;
    }

    const targetTop = container.scrollHeight - container.clientHeight;
    const distance = targetTop - container.scrollTop;

    if (distance <= 1) {
        container.scrollTop = targetTop;
        return;
    }

    // Ease-out interpolation for continuous, smooth following.
    container.scrollTop += Math.max(1, distance * 0.22);
}

function startStreamAutoScroll() {
    if (scrollRafId.value !== null) {
        return;
    }

    const tick = () => {
        if (!isAutoScrollEnabledForCurrentReply.value) {
            scrollRafId.value = null;
            return;
        }
        smoothScrollStepToBottom();
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

function handleMessagesWheel(event: WheelEvent) {
    if (!chatStore.isLoading) {
        return;
    }

    // User explicitly scrolled upward: stop auto-follow for this reply only.
    if (event.deltaY < 0) {
        isAutoScrollEnabledForCurrentReply.value = false;
        stopStreamAutoScroll();
    }
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
            isAutoScrollEnabledForCurrentReply.value = true;
            startStreamAutoScroll();
            return;
        }
        stopStreamAutoScroll();
        if (isAutoScrollEnabledForCurrentReply.value) {
            scrollMessagesToBottom();
        }
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    stopStreamAutoScroll();
    document.removeEventListener("click", closeContextMenu);
    window.removeEventListener("resize", closeContextMenu);
});


onMounted(() => {
    document.addEventListener("click", closeContextMenu);
    window.addEventListener("resize", closeContextMenu);
});
</script>

<template>
    <main class="chat-panel">
        <header class="chat-header">
            <h2>{{ activeConversation?.title || "新对话" }}</h2>
            <p>模型: {{ settingsStore.settings.model }} · {{ settingsStore.settings.baseUrl }}</p>
        </header>

        <section ref="messagesEl" class="messages" @wheel.passive="handleMessagesWheel" @contextmenu="openContextMenu">
            <div v-if="!activeConversation?.messages.length" class="empty-state">
                <p>开始你的第一个问题吧。</p>
                <p class="sub">左侧可以管理会话，设置里填写 API Key 后即可发问。</p>
            </div>

            <article v-for="message in activeConversation?.messages || []" :key="message.id" class="message"
                :class="message.role">
                <div class="role">{{ message.role === "user" ? "你" : "助手" }}</div>
                <div class="content markdown-body" v-diff-html="renderMarkdown(message.content)" />
            </article>

            <transition name="context-menu-scale">
                <div v-if="contextMenuOpen" ref="contextMenuEl" class="context-menu"
                    :style="{ left: `${contextMenuX}px`, top: `${contextMenuY}px` }" @click.stop @contextmenu.prevent>
                    <button v-if="hasSelectedText" type="button" @click="handleCopySelected">复制选中</button>
                    <button type="button" @click="handleCopyAll">复制全部</button>
                    <button type="button" @click="handleCopyMarkdown">复制MD</button>
                </div>
            </transition>
        </section>

        <form class="composer" @submit.prevent="handleSubmit">
            <p v-if="chatStore.errorMessage" class="error-line">{{ chatStore.errorMessage }}</p>
            <textarea v-model="draft" placeholder="输入你的问题，按 Enter 发送，Shift + Enter 换行。" rows="3"
                @keydown.enter="handleComposerEnter" />
        </form>
    </main>
</template>

<style scoped>
.context-menu-scale-enter-active,
.context-menu-scale-leave-active {
    transition:
        scale 0.3s var(--ease-smooth),
        box-shadow 0.3s var(--ease-smooth),
        opacity 0.3s var(--ease-smooth);
}

.context-menu.context-menu-scale-enter-from,
.context-menu.context-menu-scale-leave-to {
    transform-origin: top;
    scale: 1 0;
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
    opacity: 0.3;
}

.context-menu.context-menu-scale-enter-to,
.context-menu.context-menu-scale-leave-from {
    transform-origin: top;
    scale: 1 1;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
    opacity: 1;
}

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
    position: relative;
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
.markdown-body :deep(p + table),
.markdown-body :deep(pre + p),
.markdown-body :deep(ul + p),
.markdown-body :deep(ol + p),
.markdown-body :deep(table + p),
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

.markdown-body :deep(.katex-display) {
    margin: 0.9em 0;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.4em 0;
}

.markdown-body :deep(.katex) {
    font-size: 1em;
}

.markdown-body :deep(.katex-html) {
    white-space: normal;
}

.markdown-body :deep(.katex-display > .katex) {
    display: inline-block;
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

.markdown-body :deep(table) {
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
    display: block;
    overflow-x: auto;
    max-width: 100%;
    border: 1px solid var(--line-strong);
    border-radius: 12px;
    background: var(--surface);
}

.markdown-body :deep(thead) {
    background: color-mix(in srgb, var(--accent-soft) 70%, var(--surface));
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
    padding: 10px 12px;
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
}

.markdown-body :deep(th:last-child),
.markdown-body :deep(td:last-child) {
    border-right: none;
}

.markdown-body :deep(tbody tr:last-child td) {
    border-bottom: none;
}

.markdown-body :deep(th) {
    font-weight: 600;
    color: var(--text-main);
    white-space: nowrap;
}

.markdown-body :deep(td) {
    color: var(--text-main);
}

.context-menu {
    position: absolute;
    z-index: 30;
    min-width: 140px;
    display: grid;
    gap: 4px;
    padding: 6px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: color-mix(in srgb, var(--panel-strong) 88%, transparent);
    backdrop-filter: blur(16px);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
}

.context-menu button {
    border: 0;
    background: transparent;
    color: var(--text-main);
    font: inherit;
    text-align: left;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
}

.context-menu button:hover {
    background: var(--accent-soft);
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
