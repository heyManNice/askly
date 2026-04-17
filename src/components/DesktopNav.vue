<template>
    <!-- 头像 -->
    <img class="w-10 h-10 rounded flex-none object-cover" :src="avatar" alt="avatar">
    <!-- 导航图标 -->
    <n class="flex-1 flex flex-col gap-1">
        <template v-for="(route, i) in routes" :key="route.id">
            <n class="p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer" :class="{
                'bg-gray-100 dark:bg-zinc-800': i === activeRouteIndex,
            }" :title="route.label" @click="openRoute(i)">
                <component :is="route.icon" />
            </n>
        </template>
    </n>
    <!-- 菜单按钮 -->
    <n class="p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800">
        <FiMenu class="cursor-pointer" />
    </n>
</template>
<script lang="ts" setup>
import avatar from '@images/avatar.jpg';

import {
    FiMenu,
} from 'vue-icons-plus/fi';

import {
    routes,
    activeRouteIndex,
    openRoute
} from '@routes/main';


</script>