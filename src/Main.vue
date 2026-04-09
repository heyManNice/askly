<template>
    <!-- 总容器 -->
    <n class="flex flex-row h-screen">
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
        <!-- 内容区 -->
        <n class="flex-1 flex flex-row">
            <!-- 功能列表区上下分栏 -->
            <n class="w-60 flex flex-col gap-2">
                <!-- 搜索框 -->
                <n class="h-8 flex">
                    <input class="flex-1 px-2 bg-gray-100 rounded" type="text" placeholder="搜索">
                </n>
                <!-- 列表区域 -->
                <n class="flex-1 flex flex-col gap-2">
                    <!-- 列表卡片 -->
                    <n v-for="conversation in conversations" :key="conversation.id"
                        class="flex items-center rounded cursor-pointer hover:bg-gray-100 gap-2">
                        <!-- 左边头像 -->
                        <img class="w-10 rounded" :src="conversation.avatar" alt="avatar">
                        <!-- 右边文字 -->
                        <n class="flex flex-col flex-1 overflow-hidden">
                            <!-- 标题和时间 -->
                            <n class="flex items-center gap-2">
                                <!-- 标题 -->
                                <n class="font-medium mr-auto truncate">
                                    {{ conversation.title }}
                                </n>
                                <!-- 更新时间 -->
                                <n class="text-xs text-gray-500">{{
                                    conversation.updatedAt }}
                                </n>
                            </n>
                            <!-- 会话信息 -->
                            <n class="text-sm text-gray-500 truncate">
                                {{ conversation.lastMessage }}
                            </n>
                        </n>
                    </n>
                </n>
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

// 会话列表
type Conversation = {
    id: number;
    title: string;
    avatar: string;
    lastMessage: string;
    updatedAt: string;
};

import xiaomi from './image/xiaomi.jpg';
import doubao from './image/doubao.jpg';
import gpt from './image/gpt.jpg';

const conversations: Conversation[] = [
    {
        id: 1,
        title: '猫小咪',
        avatar: xiaomi,
        lastMessage: '这是内容非常长非常长非常长的信息',
        updatedAt: '18:39'
    },
    {
        id: 2,
        title: '豆小包',
        avatar: doubao,
        lastMessage: '我懂了，我真的懂了',
        updatedAt: '17:25'
    },
    {
        id: 3,
        title: '鸡小替',
        avatar: gpt,
        lastMessage: '我就在这里，不躲不逃，稳稳地接住你',
        updatedAt: '16:00'
    }
];

</script>
