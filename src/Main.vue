<script lang="ts" setup>
import ChatSidebar from "./components/ChatSidebar.vue";
import ChatPanel from "./components/ChatPanel.vue";
import SettingsModal from "./components/SettingsModal.vue";
</script>

<template>
    <div class="app-shell">
        <ChatSidebar />
        <ChatPanel />
        <SettingsModal />
    </div>
</template>

<style>
:root {
    color-scheme: light dark;
    --bg-1: #eef4f0;
    --bg-2: #f7faf8;
    --bg-accent: rgba(29, 122, 92, 0.09);
    --panel: rgba(255, 255, 255, 0.9);
    --panel-strong: rgba(255, 255, 255, 0.98);
    --surface: #ffffff;
    --surface-soft: #f4f8f6;
    --text-main: #1f2824;
    --text-sub: #5f6f67;
    --line: #d8e2dd;
    --line-strong: #bfd0c7;
    --accent: #1d7a5c;
    --accent-strong: #11563f;
    --accent-soft: #e8f2ed;
    --danger: #9f3a2b;
    --danger-soft: #fff2ee;
    --shadow: 0 24px 64px rgba(20, 38, 31, 0.08);
    --backdrop: rgba(16, 37, 26, 0.34);
    --code-bg: #15251f;
    --code-text: #f6fff9;
    --inline-code-bg: #e9f3ee;
    --inline-code-text: #0f4a36;
    --blockquote-line: #b4cec2;
    --focus-ring: 0 0 0 3px rgba(29, 122, 92, 0.18);
    --scrollbar-thumb: rgba(85, 112, 101, 0.34);
    --scrollbar-track: transparent;
}

@media (prefers-color-scheme: dark) {
    :root {
        --bg-1: #0d1411;
        --bg-2: #121b17;
        --bg-accent: rgba(75, 167, 127, 0.12);
        --panel: rgba(18, 27, 23, 0.88);
        --panel-strong: rgba(21, 31, 27, 0.96);
        --surface: #16211c;
        --surface-soft: #1a2721;
        --text-main: #e7f0ea;
        --text-sub: #9db0a6;
        --line: #27352f;
        --line-strong: #355145;
        --accent: #5eb892;
        --accent-strong: #86d8b1;
        --accent-soft: #1c3028;
        --danger: #ef8e7d;
        --danger-soft: #2a1b18;
        --shadow: 0 24px 64px rgba(0, 0, 0, 0.38);
        --backdrop: rgba(3, 8, 6, 0.56);
        --code-bg: #0b1611;
        --code-text: #dff8ea;
        --inline-code-bg: #1b2b23;
        --inline-code-text: #b7f0cf;
        --blockquote-line: #3b5a4d;
        --focus-ring: 0 0 0 3px rgba(94, 184, 146, 0.22);
        --scrollbar-thumb: rgba(145, 172, 160, 0.34);
        --scrollbar-track: rgba(255, 255, 255, 0.03);
    }
}

* {
    box-sizing: border-box;
}

html {
    min-height: 100%;
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
    background: transparent;
}

button,
input,
textarea {
    transition:
        background-color 160ms ease,
        border-color 160ms ease,
        color 160ms ease,
        box-shadow 160ms ease,
        transform 160ms ease;
}

::-webkit-scrollbar {
    width: 12px;
    height: 12px;
}

::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
}

::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 999px;
    border: 3px solid transparent;
    background-clip: content-box;
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
</style>