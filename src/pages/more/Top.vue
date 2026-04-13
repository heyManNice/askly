<template>
    <n class="flex-1 flex flex-col">
        <!-- 设置头像 -->
        <n class="flex pb-2 pt-2 px-2">
            <!-- 左边的头像 -->
            <img :src="avatar" alt="avatar" class="rounded w-15">
        </n>
        <!-- more的导航选项 -->
        <TransitionGroup name="more-nav" tag="div" class="more-nav-list">
            <n v-for="route in moreRoutes" :key="route.id"
                class="flex gap-3 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer items-center"
                @click="pageController.toSubPage()">
                <!-- 图标 -->
                <component :is="route.icon" class="w-5 h-5" />
                <!-- 标签 -->
                <n class="mr-auto">{{ route.label }}</n>
                <FiChevronRight class="w-4 h-4" />
            </n>
        </TransitionGroup>
    </n>
</template>
<script lang="ts" setup>
import {
    computed
} from 'vue';

import avatar from '@images/avatar.jpg';

import {
    FiChevronRight
} from 'vue-icons-plus/fi'

import {
    usePageController
} from '@layouts/Mountain.controller';

const pageController = usePageController();

import {
    usePufferStore
} from '@stores/puffer';

const pufferStore = usePufferStore();


import {
    routes
} from '@routes/main';

const moreRoutes = computed(() => {
    return routes.slice(pufferStore.mobileNavIconCount).filter((route) => !route.hiddenOnDesktop);
});
</script>

<style scoped>
.more-nav-list {
    position: relative;
    display: grid;
}

.more-nav-enter-active,
.more-nav-leave-active,
.more-nav-move {
    transition:
        transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
        opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.more-nav-enter-from,
.more-nav-leave-to {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
}

.more-nav-leave-active {
    position: absolute;
    width: 100%;
}
</style>