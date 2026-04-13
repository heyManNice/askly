<template>
    <!-- 总容器 -->
    <n class="flex flex-row h-screen dark:text-zinc-200">
        <!-- 电脑端导航栏 -->
        <transition name="flex-scale-x">
            <n v-if="pufferStore.morph !== 'compact'"
                class="z-60 bg-white dark:bg-black w-15 shrink-0 flex flex-col gap-3 items-center pb-2">
                <!-- 电脑导航插槽 -->
                <slot name="desktop-nav" />
            </n>
        </transition>
        <!-- 导航页面区域 -->
        <n class="flex-1 flex flex-row relative">
            <!-- 一级内容区域 -->
            <transition :name="pufferStore.morph !== 'expanded' ? 'slide-bg-l' : 'flex-scale-x'">
                <n v-if="pageController.currentPage === 'top-page' || pufferStore.morph === 'expanded'"
                    class="w-full h-full md:w-60 sm:border-l border-gray-200 dark:border-zinc-900 flex flex-col gap-2 md:static absolute dark:bg-black">
                    <!-- 一级内容插槽 -->
                    <slot v-if="!mspc.isShowMorePage" name="top-page" />
                    <MoreTop v-if="mspc.isShowMorePage" />
                    <!-- 手机版导航区 -->
                    <transition name="slide-fg-b">
                        <n v-if="pufferStore.morph === 'compact'"
                            class="h-14 flex z-40 bg-white dark:bg-black flex-row gap-2 p-2 border-t dark:border-zinc-900 border-gray-200 justify-between px-5 pt-2 pb-1">
                            <!-- 手机导航插槽 -->
                            <slot name="mobile-nav" />
                        </n>
                    </transition>
                </n>
            </transition>

            <!-- 二级内容区域 -->
            <transition :name="pufferStore.morph !== 'expanded' ? 'slide-fg-r' : 'disable'">
                <n v-if="!mspc.isShowMorePage && pageController.currentPage !== 'top-page'"
                    class="flex-1 flex flex-col h-screen md:h-full z-50 border-l bg-white dark:bg-black dark:border-zinc-900 border-gray-200 absolute md:static w-full">
                    <!-- 二级内容插槽 -->
                    <slot name="sub-page" />
                </n>
            </transition>
        </n>
    </n>
</template>

<script lang="ts" setup>
import {
    usePufferStore
} from '@stores/puffer';

const pufferStore = usePufferStore();

import {
    usePageController
} from '@layouts/Mountain.controller';
const pageController = usePageController();

pufferStore.onResize((m) => {
    if (m === 'expanded') {
        pageController.currentPage = 'both-page';
    }
});

import {
    useMoreSubPageController
} from '@stores/more';
const mspc = useMoreSubPageController();

import MoreTop from '@pages/more/Top.vue';
</script>

<style scoped>
/* 前景页面右侧滑入滑出动画 */
.slide-fg-r-enter-active,
.slide-fg-r-leave-active {
    transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1),
        box-shadow-color 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    box-shadow: -1rem 0 2rem rgba(0, 0, 0, 0.05);
}

.slide-fg-r-enter-from {
    transform: translateX(100%);
}

.slide-fg-r-leave-to {
    transform: translateX(100%);
}

/* 背景页面左侧滑入滑出动画 */
.slide-bg-l-enter-active {
    transition: transform 0.5s ease;
}

.slide-bg-l-leave-active {
    transition: transform 0.5s ease;
}

.slide-bg-l-enter-from {
    transform: translateX(-20%);
}

.slide-bg-l-leave-to {
    transform: translateX(-20%);
}

/* flex x轴缩小动画 */
.flex-scale-x-enter-active,
.flex-scale-x-leave-active {
    transition: width 0.5s ease;
    overflow: hidden;
}

.flex-scale-x-enter-from,
.flex-scale-x-leave-to {
    width: 0;
}

/* 向下滑动动画 */
.slide-fg-b-enter-active,
.slide-fg-b-leave-active {
    transition: transform 0.5s ease, opacity 0.5s ease;
}

.slide-fg-b-enter-from,
.slide-fg-b-leave-to {
    transform: translateY(100%);
    opacity: 0;
}
</style>
