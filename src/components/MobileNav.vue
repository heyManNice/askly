<template>
    <!-- 导航图标 -->
    <TransitionGroup name="slide" tag="div" class="mobile-nav-group" @before-leave="onBeforeLeave">
        <n v-for="(route, i) in routes.slice(0, pufferStore.mobileNavIconCount)" :key="route.id"
            class="flex flex-col items-center cursor-pointer w-15" :class="{
                'text-blue-400': !isShowMorePage && i === selectedRoute
            }" @click="selectedRoute = i, isShowMorePage = false">
            <component :is="route.icon" />
            <n class="text-xs">{{ route.label }}</n>
        </n>
        <!-- 额外的导航项 -->
        <n key="more" class="flex flex-col items-center cursor-pointer w-15" :class="{
            'text-blue-400': isShowMorePage
        }" @click="isShowMorePage = true">
            <FiMenu />
            <n class=" text-xs">更多</n>
        </n>
    </TransitionGroup>
</template>

<script lang="ts" setup>
import {
    FiMenu,
} from 'vue-icons-plus/fi';

import {
    routes,
    selectedRoute,
} from '@routes/main';

import {
    usePufferStore
} from '@stores/puffer';
import { ref } from 'vue';

const pufferStore = usePufferStore();

// 是否显示more页面
const isShowMorePage = ref(false);

pufferStore.onResize(() => {
    // 如果当前选中的导航图标已经不显示，那么就显示more
    if (selectedRoute.value >= pufferStore.mobileNavIconCount) {
        isShowMorePage.value = true;
    } else {
        isShowMorePage.value = false;
    }
});

// 离开动画的flip效果
function onBeforeLeave(el: Element) {
    const node = el as HTMLElement;
    const parent = node.offsetParent as HTMLElement | null;
    if (!parent)
        return;

    const rect = node.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    node.style.left = `${rect.left - parentRect.left}px`;
    node.style.top = `${rect.top - parentRect.top}px`;
    node.style.width = `${rect.width}px`;
    node.style.height = `${rect.height}px`;
}
</script>
<style scoped>
.slide-enter-active,
.slide-leave-active {
    transition: transform 0.35s ease, opacity 0.35s ease;
    transform-origin: center;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    transform: scale(0.7) translateY(100%);
}

.slide-move {
    transition: transform 0.35s ease;
}

.slide-leave-active {
    position: absolute;
    z-index: 1;
    pointer-events: none;
}

.mobile-nav-group {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: space-between;
}
</style>