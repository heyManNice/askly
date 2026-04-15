<template>
    <n v-if="pufferStore.morph !== 'expanded'" @mousedown="handleMouseDown" class="flex flex-row px-2 pb-2  pr-12">
        <!-- 左边返回图标 -->
        <FiChevronLeft @mousedown.stop @click="pageController.popPage()"
            class="w-5 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 rounded block" />
        <!-- 标题内容 -->
        <n class="mr-auto ml-auto">{{ title ?? '详情' }}</n>
    </n>
</template>
<script lang="ts" setup>
import windowm from '@eziapp-org/bridge/windowm';
import {
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

const prop = defineProps<{
    title?: string;
}>();

const title = prop.title;

</script>