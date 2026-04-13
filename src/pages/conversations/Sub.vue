<template>
    <!-- 顶部标题栏 -->
    <n @mousedown="handleMouseDown" class="flex flex-row px-2 pb-2 border-b border-gray-200">
        <!-- 左边返回图标 -->
        <FiChevronLeft @mousedown.stop @click="pageController.toTopPage()"
            class="w-5 cursor-pointer hover:bg-gray-100 rounded block md:hidden max-sm:mr-5" />
        <!-- 标题内容 -->
        <n class="mr-auto ml-auto md:ml-0">猫小咪</n>
        <!-- 会话操作按钮 -->
        <n @mousedown.stop class="mr-2 flex gap-2">
            <!-- 固定在顶层 -->
            <n :title="pinStore.isPinned ? '取消固定' : '固定在顶层'">
                <VscPin class="w-5 cursor-pointer hover:bg-gray-100 rounded " :class="{
                    '-rotate-45 text-blue-500': pinStore.isPinned
                }" @click="pinStore.togglePin()" />
            </n>
            <!-- 更多选项 -->
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
        <textarea class="flex-1 resize-none" type="text" placeholder="按 Enter 发送，按 Shift + Enter 换行" />
    </n>
</template>

<script lang="ts" setup>
import windowm from '@eziapp-org/bridge/windowm';
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
    usePageController
} from '@layouts/Mountain.controller';
const pageController = usePageController();

import {
    usePinStore
} from '@stores/pin';

const pinStore = usePinStore();

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