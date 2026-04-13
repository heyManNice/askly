<template>
    <!-- 总容器 -->
    <n class="flex flex-row h-screen">
        <!-- 电脑端导航栏 -->
        <transition name="flex-scale-x">
            <n v-if="pufferStore.morph !== 'compact'"
                class="z-60 bg-white w-15 shrink-0 flex flex-col gap-3 items-center pb-2 ">
                <!-- 电脑导航插槽 -->
                <slot name="desktop-nav" />
            </n>
        </transition>
        <!-- 导航页面区域 -->
        <n class="flex-1 flex flex-row relative">
            <!-- 一级内容区域 -->
            <transition :name="pufferStore.morph !== 'expanded' ? 'slide-bg-l' : 'flex-scale-x'">
                <n v-if="currentPage === 'top-page' || pufferStore.morph === 'expanded'"
                    class="w-full h-full md:w-60 sm:border-l border-gray-200 flex flex-col gap-2 px-2 md:static absolute">
                    <!-- 一级内容插槽 -->
                    <slot name="top-page" :page="page" />
                    <!-- 手机版导航区 -->
                    <transition name="slide-fg-b">
                        <n v-if="pufferStore.morph === 'compact'"
                            class="h-14 flex z-40 bg-white flex-row gap-2 p-2 border-t border-gray-200 justify-between px-5 pt-2 pb-1">
                            <!-- 手机导航插槽 -->
                            <slot name="mobile-nav" :page="page" />
                        </n>
                    </transition>
                </n>
            </transition>

            <!-- 二级内容区域 -->
            <transition :name="pufferStore.morph !== 'expanded' ? 'slide-fg-r' : 'disable'">
                <n v-if="currentPage !== 'top-page'"
                    class="flex-1 flex flex-col h-screen md:h-full z-50 border-l bg-white border-gray-200 absolute md:static w-full">
                    <!-- 二级内容插槽 -->
                    <slot name="sub-page" :page="page" />
                </n>
            </transition>
        </n>
    </n>
</template>

<script lang="ts" setup>
import {
    ref
} from 'vue';

import {
    usePufferStore
} from '@stores/puffer';

const pufferStore = usePufferStore();

import {
    selectedRoute,
    moreRouteIndex
} from '@routes/main';

type CurrentPage = 'top-page' | 'sub-page' | 'both-page';
const currentPage = ref<CurrentPage>(pufferStore.morph === 'expanded' ? 'both-page' : 'top-page');

pufferStore.onResize((m) => {
    if (m === 'expanded') {
        currentPage.value = 'both-page';
    }

    // 如果当前在more页且切换到桌面布局，重置到第一个页面
    // more页仅在手机上显示，桌面布局没有more页
    if (selectedRoute.value === moreRouteIndex && m !== 'compact') {
        selectedRoute.value = 0;
    }
});

const page = {
    toSubPage() {
        if (pufferStore.morph !== 'expanded') {
            currentPage.value = 'sub-page';
        }
    },
    toTopPage() {
        if (pufferStore.morph !== 'expanded') {
            currentPage.value = 'top-page';
        }
    }
};
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
