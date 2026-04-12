<script lang="ts" setup>
import { ref, watch } from "vue";
import { useSettingsStore } from "@stores/settings";
import { useUiStore } from "@stores/ui";

const settingsStore = useSettingsStore();
const uiStore = useUiStore();

const formApiKey = ref("");
const formBaseUrl = ref("");
const formModel = ref("");
const formTemperature = ref("");
const formSystemPrompt = ref("");

function fillFormFromSettings() {
    formApiKey.value = settingsStore.settings.apiKey;
    formBaseUrl.value = settingsStore.settings.baseUrl;
    formModel.value = settingsStore.settings.model;
    formTemperature.value = settingsStore.settings.temperature.toString();
    formSystemPrompt.value = settingsStore.settings.systemPrompt;
}

function saveSettings() {
    settingsStore.updateSettings({
        apiKey: formApiKey.value.trim(),
        baseUrl: formBaseUrl.value.trim(),
        model: formModel.value.trim(),
        temperature: Number(formTemperature.value),
        systemPrompt: formSystemPrompt.value.trim(),
    });
    uiStore.closeSettings();
}

watch(
    () => uiStore.isSettingsOpen,
    (open) => {
        if (open) {
            fillFormFromSettings();
        }
    },
    { immediate: true },
);
</script>

<template>
    <transition name="modal-fade-scale">
        <div v-if="uiStore.isSettingsOpen" class="modal-backdrop">
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
                    <button class="ghost-btn" @click="uiStore.closeSettings">取消</button>
                    <button class="primary-btn" @click="saveSettings">保存</button>
                </div>
            </section>
        </div>
    </transition>
</template>

<style scoped>
.modal-fade-scale-enter-active .settings-modal,
.modal-fade-scale-leave-active .settings-modal {
    transition:
        opacity 0.3s var(--ease-smooth),
        transform 0.3s var(--ease-smooth);
}

.modal-fade-scale-enter-active,
.modal-fade-scale-leave-active {
    transition: background-color 0.3s var(--ease-smooth);
}

.modal-fade-scale-enter-from.modal-backdrop,
.modal-fade-scale-leave-to.modal-backdrop {
    background-color: rgba(0, 0, 0, 0);
}

.modal-fade-scale-enter-to.modal-backdrop,
.modal-fade-scale-leave-from.modal-backdrop {
    background-color: var(--backdrop);
}

.modal-fade-scale-enter-from .settings-modal,
.modal-fade-scale-leave-to .settings-modal {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
}

.modal-fade-scale-enter-to .settings-modal,
.modal-fade-scale-leave-from .settings-modal {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.modal-backdrop {
    position: fixed;
    inset: 0;
    background: var(--backdrop);
    display: grid;
    place-items: center;
    padding: 20px;
}

.settings-modal {
    border: 1px solid var(--line);
    background: var(--panel);
    backdrop-filter: blur(8px);
    border-radius: 18px;
    box-shadow: var(--shadow);
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

.settings-modal input,
.settings-modal textarea {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px 12px;
    font: inherit;
    color: var(--text-main);
    background: var(--surface);
    resize: none;
    outline: none;
}

.settings-modal input:focus,
.settings-modal textarea:focus {
    border-color: var(--accent);
    box-shadow: var(--focus-ring);
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
}

.primary-btn,
.ghost-btn {
    border-radius: 10px;
    border: 1px solid transparent;
    padding: 10px 14px;
    font: inherit;
    cursor: pointer;
}

.primary-btn {
    background: var(--accent);
    color: white;
}

.ghost-btn {
    background: var(--surface-soft);
    border-color: var(--line);
    color: var(--text-main);
}
</style>
