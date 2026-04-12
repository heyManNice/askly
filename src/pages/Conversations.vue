<template>
    <!-- 一级内容区域 -->
    <template v-if="panel === 'top-page'">
        <!-- 搜索区域 -->
        <n class="h-8 flex shrink-0">
            <!-- 搜索输入框 -->
            <input class="flex-1 px-2 bg-gray-100 rounded" type="text" placeholder="搜索">
        </n>
        <!-- 会话列表区域 -->
        <n class="flex-1 flex flex-col gap-2 overflow-y-auto">
            <n v-for="conversation in conversations" :key="conversation.id" @click="page.toSubPage()"
                class="flex items-center rounded cursor-pointer hover:bg-gray-100 gap-2">
                <!-- 头像 -->
                <img class="w-10 rounded" :src="conversation.avatar" alt="avatar">
                <!-- 右边的文字 -->
                <n class="flex flex-col flex-1 overflow-hidden">
                    <n class="flex items-center gap-2">
                        <!-- 标题 -->
                        <n class="font-medium mr-auto truncate">
                            {{ conversation.title }}
                        </n>

                        <!-- 时间 -->
                        <n class="text-xs text-gray-500">
                            {{ conversation.updatedAt }}
                        </n>
                    </n>

                    <!-- 详细内容 -->
                    <n class="text-sm text-gray-500 truncate">
                        {{ conversation.lastMessage }}
                    </n>
                </n>
            </n>
        </n>
    </template>
    <!-- 二级内容区域 -->
    <template v-else>
        <!-- 顶部标题栏 -->
        <n @mousedown="handleMouseDown" class="flex flex-row px-2 pb-2 border-b border-gray-200">
            <!-- 左边返回图标 -->
            <FiChevronLeft @mousedown.stop @click="page.toTopPage()"
                class="w-5 cursor-pointer hover:bg-gray-100 rounded block md:hidden max-sm:mr-5" />
            <!-- 标题内容 -->
            <n class="mr-auto ml-auto md:ml-0">猫小咪</n>
            <!-- 会话操作按钮 -->
            <n @mousedown.stop class="mr-2 flex gap-2">
                <n title="固定在顶层">
                    <VscPin class="w-5 cursor-pointer hover:bg-gray-100 rounded" />
                </n>
                <n title="更多">
                    <FiMoreHorizontal class="w-5 cursor-pointer hover:bg-gray-100 rounded" />
                </n>
            </n>
        </n>
        <!-- 会话信息 -->
        <n class="flex-1"></n>
        <!-- 输入框 -->
        <n class="h-40 flex flex-col shrink-0 border-t border-gray-200 px-2 py-1 gap-1">
            <!-- 输入框富文本选项 -->
            <n class="flex flex-row gap-2">
                <n v-for="btn in mediaButtons" :key="btn.label" :title="btn.label">
                    <component :is="btn.icon" class="w-5 h-5 cursor-pointer hover:bg-gray-100 rounded" />
                </n>
            </n>
            <!-- 文字输入框 -->
            <textarea class="flex-1 resize-none" type="text" placeholder="输入你的问题，按 Enter 发生，按 Shift + Enter 换行。" />
        </n>
    </template>
</template>

<script lang="ts" setup>
import {
    FiMoreHorizontal,
    FiFolder,
    FiImage,
    FiChevronLeft
} from 'vue-icons-plus/fi';

import {
    VscPin
} from 'vue-icons-plus/vsc';

import xiaomi from '@images/xiaomi.jpg';
import doubao from '@images/doubao.jpg';
import gpt from '@images/gpt.jpg';

import windowm from '@eziapp-org/bridge/windowm';

type PageSwitcher = {
    toTopPage: () => void;
    toSubPage: () => void;
};

const props = defineProps<{
    panel: 'top-page' | 'sub-page';
    page: PageSwitcher;
}>();

const panel = props.panel;
const page = props.page;

// 鼠标左键拖动标题栏
function handleMouseDown(event: MouseEvent) {
    if (event.button === 0) {
        windowm.getCurrentWindow()
            .then(win => {
                win.drag();
            });
    }
}

const conversations = [
    {
        id: 1,
        title: '猫小咪',
        avatar: xiaomi,
        lastMessage: '这是内容非常长非常长非常长的信息',
        updatedAt: '18:39'
    },
    {
        id: 2,
        title: '豆小包',
        avatar: doubao,
        lastMessage: '我懂了，我真的懂了',
        updatedAt: '17:25'
    },
    {
        id: 3,
        title: '鸡小替',
        avatar: gpt,
        lastMessage: '我就在这里，不躲不逃，稳稳地接住你',
        updatedAt: '16:00'
    }
];

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
</script>
