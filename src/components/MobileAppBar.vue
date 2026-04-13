<template>
    <n v-if="pufferStore.morph === 'compact'" @mousedown="handleMouseDown"
        class="flex flex-row px-2 pb-2 border-gray-200">
        <!-- 左边返回图标 -->
        <FiChevronLeft @mousedown.stop @click="pageController.toTopPage()"
            class="w-5 cursor-pointer hover:bg-gray-100 rounded block" />
        <!-- 标题内容 -->
        <n class="mr-auto ml-auto">二级页面</n>
        <!-- 会话操作按钮 -->
        <n @mousedown.stop class="mr-2 flex gap-2">
            <!-- 更多选项 -->
            <n title="更多">
                <FiMoreHorizontal class="w-5 cursor-pointer hover:bg-gray-100 rounded" />
            </n>
        </n>
    </n>
</template>
<script lang="ts" setup>
import windowm from '@eziapp-org/bridge/windowm';
import {
    FiMoreHorizontal,
    FiChevronLeft
} from 'vue-icons-plus/fi';


import { usePufferStore } from '@stores/puffer';
const pufferStore = usePufferStore();

import {
    usePageController
} from '@layouts/Mountain.controller';
const pageController = usePageController();

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