<template>
    <transition class="px-2" name="slide-fg-b">
        <!-- 导航图标 -->
        <TransitionGroup v-if="pufferStore.morph === 'compact' && pageStack.stack.length < 2" name="slide" tag="div"
            class="mobile-nav-group" @before-leave="onBeforeLeave">
            <n v-for="(route, i) in routes.slice(0, pufferStore.mobileNavIconCount)" :key="route.id"
                class="flex flex-col items-center cursor-pointer w-15" :class="{
                    'text-blue-400': i === activeRouteIndex && !props.isMoreNav
                }" @click="openRoute(i)">
                <component :is="route.icon" />
                <n class="text-xs">{{ route.label }}</n>
            </n>
            <!-- 额外的导航项 -->
            <n key="more" class="flex flex-col items-center cursor-pointer w-15" :class="{
                'text-blue-400': props.isMoreNav
            }" @click="pageStack.replace(MobileMoreNavPage)">
                <FiMenu />
                <n class=" text-xs">更多</n>
            </n>
        </TransitionGroup>
    </transition>

</template>

<script lang="ts" setup>
import {
    FiMenu,
} from 'vue-icons-plus/fi';

import {
    routes,
    activeRouteIndex,
    openRoute,
} from '@routes/main';

import {
    usePufferStore
} from '@stores/puffer';

const pufferStore = usePufferStore();

import {
    usePageStackStore
} from '@stores/pageStack';

const pageStack = usePageStackStore();

import MobileMoreNavPage from '@components/MobileMoreNavPage.vue';

const props = defineProps<{
    isMoreNav?: boolean
}>();

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