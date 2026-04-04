<script lang="ts" setup>
import { computed } from "vue";
import { useChatStore } from "../stores/chat";
import { useUiStore } from "../stores/ui";

const chatStore = useChatStore();
const uiStore = useUiStore();

const conversations = computed(() => chatStore.conversations);
const activeConversation = computed(() => chatStore.activeConversation);

function removeActiveConversation() {
    if (!activeConversation.value) {
        return;
    }
    chatStore.removeConversation(activeConversation.value.id);
}
</script>

<template>
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
            <button class="ghost-btn" @click="uiStore.openSettings">设置 API</button>
            <button class="danger-btn" :disabled="!activeConversation" @click="removeActiveConversation">
                删除当前对话
            </button>
        </div>
    </aside>
</template>

<style scoped>
.sidebar {
    border: 1px solid var(--line);
    background: var(--panel);
    backdrop-filter: blur(8px);
    border-radius: 18px;
    box-shadow: var(--shadow);
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
    background: var(--panel-strong);
    border-radius: 12px;
    padding: 10px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
}

.conversation-item.active {
    border-color: var(--line-strong);
    background: var(--accent-soft);
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

.ghost-btn,
.danger-btn {
    border-radius: 10px;
    border: 1px solid transparent;
    padding: 10px 14px;
    font: inherit;
    cursor: pointer;
}

.ghost-btn {
    background: var(--surface-soft);
    border-color: var(--line);
    color: var(--text-main);
}

.danger-btn {
    background: var(--danger-soft);
    border-color: var(--line-strong);
    color: var(--danger);
}

.danger-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}
</style>
