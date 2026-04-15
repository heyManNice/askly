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
            <!-- 背景页面区域（桌面端显示栈顶第二页，移动端显示基础页） -->
            <transition :name="backgroundTransitionName" @after-enter="onPageTransitionDone"
                @after-leave="onPageTransitionDone">
                <n v-if="isBackgroundVisible && pageController.backgroundPageCached"
                    class="h-full sm:border-l border-gray-200 dark:border-zinc-900 flex flex-col gap-2 dark:bg-black"
                    :class="backgroundContainerClass">
                    <!-- 背景页面组件 -->
                    <component :is="pageController.backgroundPageCached.component"
                        :key="`bg-${pageController.backgroundPageCached.key}`"
                        v-bind="pageController.backgroundPageCached.props" />

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

            <!-- 前景页面区域（显示栈顶页） -->
            <transition :name="foregroundTransitionName" @after-enter="onPageTransitionDone"
                @after-leave="onPageTransitionDone">
                <n v-if="pageController.foregroundPageCached"
                    class="flex-1 flex flex-col h-screen md:h-full z-50 border-l bg-white dark:bg-black dark:border-zinc-900 border-gray-200 absolute md:static w-full">
                    <!-- 前景页面组件 -->
                    <component :is="pageController.foregroundPageCached.component"
                        :key="`fg-${pageController.foregroundPageCached.key}`"
                        v-bind="pageController.foregroundPageCached.props" />
                </n>
            </transition>
        </n>
    </n>
</template>

<script lang="ts" setup>
import {
    computed,
    ref,
    watch
} from 'vue';

import {
    usePufferStore
} from '@stores/puffer';

const pufferStore = usePufferStore();

import {
    usePageController
} from '@layouts/Mountain.controller';
const pageController = usePageController();

const isMorphSwitching = ref(false);

pufferStore.onResize((m) => {
    if (m === 'expanded') {
        // 栅格切换到桌面端时，不触发页面切换动画，改用 flex-scale-x
        isMorphSwitching.value = true;
    }
    if (m !== 'expanded') {
        isMorphSwitching.value = true;
    }
});

watch(() => pufferStore.morph, (next, prev) => {
    if (prev && next !== prev) {
        isMorphSwitching.value = true;
    }
});

const backgroundContainerClass = computed(() => {
    const hasSecond = pageController.hasSecondPage;
    if (pufferStore.morph !== 'expanded') {
        return pageController.isMobileForegroundMode ? 'w-full absolute left-0 top-0' : 'w-full';
    }
    return hasSecond ? 'w-full md:w-60 md:static absolute left-0 top-0 shrink-0' : 'w-full md:static absolute left-0 top-0';
});

const isBackgroundVisible = computed(() => {
    if (pufferStore.morph === 'expanded') {
        return true;
    }
    return !pageController.isMobileForegroundMode;
});

const isPageStackSwitching = computed(() => {
    return pageController.transitionAction === 'push' || pageController.transitionAction === 'pop';
});

const backgroundTransitionName = computed(() => {
    if (isMorphSwitching.value && pufferStore.morph === 'expanded') {
        return 'flex-scale-x';
    }
    if (isPageStackSwitching.value) {
        return 'slide-bg-l';
    }
    return 'disable';
});

const foregroundTransitionName = computed(() => {
    if (isPageStackSwitching.value) {
        return 'slide-fg-r';
    }
    return 'disable';
});

function onPageTransitionDone() {
    if (pageController.transitionAction !== 'none') {
        pageController.clearTransitionAction();
    }
    if (isMorphSwitching.value) {
        isMorphSwitching.value = false;
    }
}
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

/* 禁用过渡 */
.disable-enter-active,
.disable-leave-active {
    transition: none;
}

.disable-enter-from,
.disable-leave-to {
    opacity: 1;
}
</style>
