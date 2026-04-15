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
            <!-- 电脑布局显示栈第二页面 -->
            <!-- 仅在电脑并且有第二页面时显示 -->
            <transition v-if="pageController.stack.length > 1"
                :name="pufferStore.morph !== 'expanded' ? 'slide-bg-l' : 'flex-scale-x'">
                <component :is="pageController.stack[pageController.stack.length - 2]" />
            </transition>

            <!-- 手机和电脑显示栈顶页面 -->
            <!-- 显示栈顶新旧切换动画 -->
            <transition v-if="pageController.stack.length > 0">
                <component :is="pageController.stack[pageController.stack.length - 1]" />
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
} from '@pages/controller';
const pageController = usePageController();

import Test1 from '@pages/conversations/Top.vue';
import Test2 from '@pages/conversations/Sub.vue';

import { onMounted } from 'vue';

onMounted(() => {
    pageController.push(Test1);
    setTimeout(() => {
        pageController.push(Test2);
    }, 1000);
});

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
