<template>
    <Mountain>
        <!-- 电脑版导航栏 -->
        <template #desktop-nav>
            <!-- 头像 -->
            <img class="w-10 h-10 rounded flex-none object-cover" :src="avatar" alt="avatar">
            <!-- 导航图标 -->
            <n class="flex-1 flex flex-col gap-1">
                <template v-for="route in routes" :key="route.id">
                    <n class="p-2 rounded hover:bg-gray-100 cursor-pointer" :class="{
                        'bg-gray-100': route.id === 'conversations',
                    }" :title="route.label">
                        <component :is="route.icon" />
                    </n>
                </template>
            </n>
            <!-- 菜单按钮 -->
            <n class="p-2 rounded hover:bg-gray-100">
                <FiMenu class="cursor-pointer" />
            </n>
        </template>
        <!-- 手机版导航栏 -->
        <template #mobile-nav>
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
        <!-- 页面列表区域 -->
        <template #list-panel="{ page }">
            <n class="h-8 flex shrink-0">
                <input class="flex-1 px-2 bg-gray-100 rounded" type="text" placeholder="搜索">
            </n>
            <n class="flex-1 flex flex-col gap-2 overflow-y-auto">
                <n v-for="conversation in conversations" :key="conversation.id" @click="page.toContent()"
                    class="flex items-center rounded cursor-pointer hover:bg-gray-100 gap-2">
                    <!-- 头像 -->
                    <img class="w-10 rounded" :src="conversation.avatar" alt="avatar">
                    <!-- 右边的文字 -->
                    <n class="flex flex-col flex-1 overflow-hidden">
                        <n class="flex items-center gap-2">
                            <!-- 标题 -->
                            <n class="font-medium mr-auto truncate">
                                {{ conversation.title }}
                            </n>
                            <!-- 时间 -->
                            <n class="text-xs text-gray-500">
                                {{ conversation.updatedAt }}
                            </n>
                        </n>
                        <!-- 详细内容 -->
                        <n class="text-sm text-gray-500 truncate">
                            {{ conversation.lastMessage }}
                        </n>
                    </n>
                </n>
            </n>
        </template>
        <!-- 内容区域 -->
        <template #content-panel="{ page }">
            <!-- 顶部标题栏 -->
            <n @mousedown="handleMouseDown" class="flex flex-row px-2 pb-2 border-b border-gray-200">
                <!-- 左边返回图标 -->
                <FiChevronLeft @mousedown.stop @click="page.toList()"
                    class="w-5 cursor-pointer hover:bg-gray-100 rounded block md:hidden max-sm:mr-5" />
                <!-- 标题内容 -->
                <n class="mr-auto ml-auto md:ml-0">猫小咪</n>
                <!-- 会话操作按钮 -->
                <n @mousedown.stop class="mr-2 flex gap-2">
                    <n title="固定在顶层">
                        <VscPin class="w-5 cursor-pointer hover:bg-gray-100 rounded" />
                    </n>
                    <n title="更多">
                        <FiMoreHorizontal class="w-5 cursor-pointer hover:bg-gray-100 rounded" />
                    </n>
                </n>
            </n>
            <!-- 会话信息 -->
            <n class="flex-1"></n>
            <!-- 输入框 -->
            <n class="h-40 flex flex-col shrink-0 border-t border-gray-200 px-2 py-1 gap-1">
                <!-- 输入框富文本选项 -->
                <n class="flex flex-row gap-2">
                    <n v-for="btn in mediaButtons" :key="btn.label" :title="btn.label">
                        <component :is="btn.icon" class="w-5 h-5 cursor-pointer hover:bg-gray-100 rounded" />
                    </n>
                </n>
                <!-- 文字输入框 -->
                <textarea class="flex-1 resize-none" type="text" placeholder="输入你的问题，按 Enter 发生，按 Shift + Enter 换行。" />
            </n>
        </template>
    </Mountain>
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

import {
    VscPin
} from 'vue-icons-plus/vsc';

import Mountain from './layouts/Mountain.vue';

import windowm from "@eziapp-org/bridge/windowm";

// 鼠标左键拖动标题栏
function handleMouseDown(event: MouseEvent) {
    if (event.button === 0) {
        windowm.getCurrentWindow()
            .then(win => {
                win.drag();
            });
    }
}

type Route = {
    id: string;
    label: string;
    icon: typeof FiMessageSquare;
};

const routes: Route[] = [
    {
        id: 'conversations',
        label: '会话',
        icon: FiMessageSquare
    },
    {
        id: 'roles',
        label: '角色',
        icon: FiUsers
    },
    {
        id: 'apis',
        label: '接口',
        icon: FiServer
    },
    {
        id: 'database',
        label: '数据库',
        icon: FiDatabase
    },
    {
        id: 'resources',
        label: '资源',
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

// 聊天输入框的媒体按钮
type MediaButton = {
    icon: typeof FiFolder;
    label: string;
};

const mediaButtons: MediaButton[] = [
    {
        icon: FiFolder,
        label: '文件'
    },
    {
        icon: FiImage,
        label: '图片'
    }
];
</script>
