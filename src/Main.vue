<template>
    <!-- 总容器 -->
    <n class="flex flex-row h-screen gap-2">
        <!-- 边栏导航 -->
        <n class="w-15 shrink-0 flex flex-col gap-5 items-center pb-5">
            <!-- 头像 -->
            <img class="w-10 rounded" :src="avatar" alt="avatar">
            <!-- 操作按钮区 -->
            <n class="flex-1 flex flex-col gap-4">
                <component :is="route.icon" v-for="route in routes" :key="route.name" class="cursor-pointer" />
            </n>
            <!-- 菜单按钮区 -->
            <n>
                <FiMenu class="cursor-pointer" />
            </n>
        </n>
        <!-- 导航内容区 -->
        <n class="flex-1 flex flex-row gap-2">
            <!-- 导航列表区上下分栏 -->
            <n class="w-60 flex flex-col gap-2">
                <!-- 搜索框 -->
                <n class="h-8 flex">
                    <input class="flex-1 px-2 bg-gray-100 rounded" type="text" placeholder="搜索">
                </n>
                <!-- 列表区域 -->
                <n class="flex-1"></n>
            </n>
            <!-- 导航内容区 -->
            <n class="flex-1"></n>
        </n>
    </n>
</template>
<script lang="ts" setup>
import avatar from './image/avatar.jpg';
import {
    FiMessageSquare,
    FiServer,
    FiUsers,
    FiMenu,
    FiShoppingBag,
    FiDatabase
} from 'vue-icons-plus/fi';

type Route = {
    name: string;
    icon: typeof FiMessageSquare;
};

const routes: Route[] = [
    {
        name: 'conversations',
        icon: FiMessageSquare
    },
    {
        name: 'roles',
        icon: FiUsers
    },
    {
        name: 'apis',
        icon: FiServer
    },
    {
        name: 'database',
        icon: FiDatabase
    },
    {
        name: 'resources',
        icon: FiShoppingBag
    }
];

</script>
