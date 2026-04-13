<template>
    <n class="flex-1 flex flex-col">
        <!-- 设置头像 -->
        <n class="flex pb-2 pt-2 px-2">
            <!-- 左边的头像 -->
            <img :src="avatar" alt="avatar" class="rounded w-15">
        </n>
        <!-- more的导航选项 -->
        <template v-for="route in routes.slice(pufferStore.mobileNavIconCount)" :key="route.id">
            <n v-if="!route.hiddenOnDesktop"
                class="flex gap-3 px-2 py-2 rounded hover:bg-gray-100 cursor-pointer items-center"
                @click="pageController.toSubPage()">
                <!-- 图标 -->
                <component :is="route.icon" class="w-5 h-5" />
                <!-- 标签 -->
                <n class="mr-auto">{{ route.label }}</n>
                <FiChevronRight class="w-4 h-4" />
            </n>
        </template>

    </n>
</template>
<script lang="ts" setup>
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
</script>