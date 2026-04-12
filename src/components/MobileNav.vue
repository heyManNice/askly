<template>
    <!-- 导航图标 -->
    <template v-for="route in routes.slice(0, 2)" :key="route.id">
        <n class="flex flex-col items-center cursor-pointer">
            <component :is="route.icon" />
            <n class="text-xs">{{ route.label }}</n>
        </n>
    </template>
    <!-- 额外的导航项 -->
    <n class="flex flex-col items-center cursor-pointer">
        <FiMenu />
        <n class="text-xs">更多</n>
    </n>
</template>

<script lang="ts" setup>
import {
    FiMenu,
} from 'vue-icons-plus/fi';

import {
    routes
} from '../routes/main';
</script>