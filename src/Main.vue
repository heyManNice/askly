<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { useChatStore } from "./stores/chat";
import { useSettingsStore } from "./stores/settings";

const chatStore = useChatStore();
const settingsStore = useSettingsStore();

const draft = ref("");
const isSettingsOpen = ref(false);
const messagesRef = ref<HTMLElement | null>(null);
const scrollRafId = ref<number | null>(null);

const formApiKey = ref(settingsStore.settings.apiKey);
const formBaseUrl = ref(settingsStore.settings.baseUrl);
const formModel = ref(settingsStore.settings.model);
const formTemperature = ref(settingsStore.settings.temperature.toString());
const formSystemPrompt = ref(settingsStore.settings.systemPrompt);

const activeConversation = computed(() => chatStore.activeConversation);
const conversations = computed(() => chatStore.conversations);

const md = new MarkdownIt({
    breaks: true,
    linkify: true,
    html: false,
});

function openSettings() {
    formApiKey.value = settingsStore.settings.apiKey;
    formBaseUrl.value = settingsStore.settings.baseUrl;
    formModel.value = settingsStore.settings.model;
    formTemperature.value = settingsStore.settings.temperature.toString();
    formSystemPrompt.value = settingsStore.settings.systemPrompt;
    isSettingsOpen.value = true;
}

function saveSettings() {
    settingsStore.updateSettings({
        apiKey: formApiKey.value.trim(),
        baseUrl: formBaseUrl.value.trim(),
        model: formModel.value.trim(),
        temperature: Number(formTemperature.value),
        systemPrompt: formSystemPrompt.value.trim(),
    });
    isSettingsOpen.value = false;
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

function renderMarkdown(content: string) {
    const rawHtml = md.render(content);
    return DOMPurify.sanitize(rawHtml);
}

function scrollMessagesToBottom() {
    const container = messagesRef.value;
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
    <div class="app-shell">
        <aside class="sidebar">
            <div class="sidebar-header">
                <button class="ghost-btn" @click="chatStore.createConversation">+ 新对话</button>
            </div>

            <div class="conversation-list">
                <button v-for="item in conversations" :key="item.id" class="conversation-item"
                    :class="{ active: activeConversation?.id === item.id }"
                    @click="chatStore.setActiveConversation(item.id)">
                    <span class="conversation-title">{{ item.title }}</span>
                    <span class="conversation-time">{{ new Date(item.updatedAt).toLocaleTimeString() }}</span>
                </button>
            </div>

            <div class="sidebar-footer">
                <button class="ghost-btn" @click="openSettings">设置 API</button>
                <button class="danger-btn" :disabled="!activeConversation"
                    @click="activeConversation && chatStore.removeConversation(activeConversation.id)">
                    删除当前对话
                </button>
            </div>
        </aside>

        <main class="chat-panel">
            <header class="chat-header">
                <h2>{{ activeConversation?.title || "新对话" }}</h2>
                <p>模型: {{ settingsStore.settings.model }} · {{ settingsStore.settings.baseUrl }}</p>
            </header>

            <section ref="messagesRef" class="messages">
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

            <p v-if="chatStore.errorMessage" class="error-line">{{ chatStore.errorMessage }}</p>

            <form class="composer" @submit.prevent="handleSubmit">
                <textarea v-model="draft"
                    :placeholder="chatStore.isLoading ? '思考中...' : '输入你的问题，按 Enter 发送，Shift + Enter 换行。'" rows="3"
                    :disabled="chatStore.isLoading" @keydown.enter="handleComposerEnter" />
            </form>
        </main>

        <div v-if="isSettingsOpen" class="modal-backdrop" @click.self="isSettingsOpen = false">
            <section class="settings-modal">
                <h3>模型设置</h3>
                <label>
                    API Key
                    <input v-model="formApiKey" type="password" placeholder="sk-..." />
                </label>
                <label>
                    Base URL
                    <input v-model="formBaseUrl" type="text" placeholder="https://api.openai.com/v1" />
                </label>
                <label>
                    Model
                    <input v-model="formModel" type="text" placeholder="gpt-4o-mini" />
                </label>
                <label>
                    Temperature (0-2)
                    <input v-model="formTemperature" type="number" min="0" max="2" step="0.1" />
                </label>
                <label>
                    System Prompt
                    <textarea v-model="formSystemPrompt" rows="3" />
                </label>
                <div class="modal-actions">
                    <button class="ghost-btn" @click="isSettingsOpen = false">取消</button>
                    <button class="primary-btn" @click="saveSettings">保存</button>
                </div>
            </section>
        </div>
    </div>
</template>

<style>
:root {
    color-scheme: light;
    --bg-1: #eff4f2;
    --bg-2: #f8faf8;
    --panel: #ffffffee;
    --text-main: #1f2824;
    --text-sub: #5f6f67;
    --line: #d8e2dd;
    --accent: #1d7a5c;
    --accent-strong: #11563f;
    --danger: #9f3a2b;
}

* {
    box-sizing: border-box;
}

html,
body {
    margin: 0;
    min-height: 100%;
    font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    color: var(--text-main);
}

body {
    min-height: 100vh;
}
</style>

<style scoped>
.app-shell {
    display: grid;
    grid-template-columns: 280px 1fr;
    height: 100vh;
    gap: 16px;
    padding: 16px;
    overflow: hidden;
}

.sidebar,
.chat-panel,
.settings-modal {
    border: 1px solid var(--line);
    background: var(--panel);
    backdrop-filter: blur(8px);
    border-radius: 18px;
}

.sidebar {
    display: flex;
    flex-direction: column;
    padding: 14px;
    gap: 14px;
    min-height: 0;
}

.sidebar-header {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.app-title {
    margin: 0;
    letter-spacing: 0.04em;
    font-size: 18px;
}

.conversation-list {
    flex: 1;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.conversation-item {
    width: 100%;
    text-align: left;
    border: 1px solid var(--line);
    background: #ffffffd8;
    border-radius: 12px;
    padding: 10px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
}

.conversation-item.active {
    border-color: #7ab89f;
    background: #e8f2ed;
}

.conversation-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.conversation-time {
    font-size: 11px;
    color: var(--text-sub);
}

.sidebar-footer {
    display: grid;
    gap: 8px;
}

.chat-panel {
    display: grid;
    grid-template-rows: auto 1fr auto auto;
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
    background: #e9f4ee;
    border-color: #c9ded3;
}

.message.assistant {
    align-self: flex-start;
    background: #ffffff;
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
    background: #15251f;
    color: #f6fff9;
    border-radius: 10px;
    border: 1px solid #30483f;
    padding: 10px 12px;
}

.markdown-body :deep(code) {
    font-family: "Consolas", "SFMono-Regular", "Liberation Mono", monospace;
    font-size: 0.92em;
}

.markdown-body :deep(:not(pre) > code) {
    background: #e9f3ee;
    color: #0f4a36;
    border-radius: 6px;
    padding: 0.1em 0.35em;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
    padding-left: 1.2em;
}

.markdown-body :deep(blockquote) {
    padding-left: 0.8em;
    border-left: 3px solid #b4cec2;
    color: #50655d;
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
    grid-template-columns: 1fr auto;
}

.composer textarea,
input,
.settings-modal textarea {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px 12px;
    font: inherit;
    color: var(--text-main);
    background: #fff;
    resize: vertical;
    outline: none;
}

.composer button {
    width: 100px;
}

.composer button,
.primary-btn,
.ghost-btn,
.danger-btn {
    border-radius: 10px;
    border: 1px solid transparent;
    padding: 10px 14px;
    font: inherit;
    cursor: pointer;
}

.composer button,
.primary-btn {
    background: var(--accent);
    color: #fff;
}

.composer button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

.ghost-btn {
    background: #f5faf7;
    border-color: var(--line);
    color: var(--text-main);
}

.danger-btn {
    background: #fff5f3;
    border-color: #e8c8c1;
    color: var(--danger);
}

.modal-backdrop {
    position: fixed;
    inset: 0;
    background: #10251a55;
    display: grid;
    place-items: center;
    padding: 20px;
}

.settings-modal {
    width: min(500px, 100%);
    padding: 16px;
    display: grid;
    gap: 10px;
}

.settings-modal h3 {
    margin: 0 0 4px;
}

.settings-modal label {
    display: grid;
    gap: 6px;
    font-size: 13px;
    color: var(--text-sub);
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
}
</style>