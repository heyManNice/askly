<template>
    <!-- 总容器 -->
    <n class="flex flex-row h-screen md:gap-2">
        <!-- 边栏导航 -->
        <n class="w-15 shrink-0 flex-col gap-3 items-center pb-2 md:border-r border-gray-200 hidden sm:flex">
            <!-- 头像 -->
            <img class="w-10 rounded" :src="avatar" alt="avatar">
            <!-- 操作按钮区 -->
            <n class="flex-1 flex flex-col gap-1">
                <template v-for="route in routes" :key="route.name">
                    <!-- 外面的包围样式 -->
                    <n class="p-2 rounded hover:bg-gray-100" :class="{
                        'bg-gray-100': route.name === 'conversations',
                    }">
                        <!-- 里面的图标 -->
                        <component :is="route.icon" class="cursor-pointer" />
                    </n>
                </template>
            </n>
            <!-- 菜单按钮区 -->
            <n class="p-2 rounded hover:bg-gray-100">
                <FiMenu class="cursor-pointer" />
            </n>
        </n>
        <!-- 内容区 -->
        <n class="flex-1 flex flex-row gap-2">
            <!-- 功能列表区上下分栏 -->
            <n class="w-60 flex-col gap-2 hidden md:flex">
                <!-- 搜索框 -->
                <n class="h-8 flex shrink-0">
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
            <n class="flex-1 flex flex-col h-full border-l border-gray-200">
                <!-- 标题栏 -->
                <n class="flex flex-row px-2 pb-2 border-b border-gray-200">
                    <FiChevronLeft class="w-5 cursor-pointer hover:bg-gray-100 rounded block md:hidden" />
                    <!-- 标题文字 -->
                    <n class="mr-auto ml-auto md:ml-0">猫小咪</n>
                    <!-- 按钮操作区 -->
                    <n class="mr-2 flex">
                        <FiMoreHorizontal class="w-5 cursor-pointer hover:bg-gray-100 rounded" />
                    </n>
                </n>
                <!-- 信息显示区域 -->
                <n class="flex-1"></n>
                <!-- 信息输入框 -->
                <n class="h-40 flex flex-col shrink-0 border-t border-gray-200 px-2 py-1 gap-1">
                    <!-- 功能选择区 -->
                    <n class="flex flex-row gap-2">
                        <FiFolder class="w-5 cursor-pointer hover:bg-gray-100 rounded" />
                        <FiImage class="w-5 cursor-pointer hover:bg-gray-100 rounded" />
                    </n>
                    <!-- 输入框 -->
                    <textarea class="flex-1 resize-none" type="text"
                        placeholder="输入你的问题，按 Enter 发生，按 Shift + Enter 换行。" />
                </n>
            </n>
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
    FiDatabase,
    FiMoreHorizontal,
    FiFolder,
    FiImage,
    FiChevronLeft
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
