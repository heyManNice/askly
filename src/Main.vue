<template>
    <!-- 总容器 -->
    <n class="flex flex-row h-screen">
        <!-- 电脑边栏导航 -->
        <transition name="flex-scale-x">
            <n v-if="screenWidth >= 640"
                class="z-60 bg-white w-15 shrink-0 flex flex-col gap-3 items-center pb-2 md:border-r border-gray-200">
                <!-- 头像 -->
                <img class="w-10 h-10 rounded flex-none object-cover" :src="avatar" alt="avatar">
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
        </transition>
        <!-- 导航页面区 -->
        <n class="flex-1 flex flex-row relative">
            <!-- 功能列表区 -->
            <transition :name="screenWidth < 768 ? 'slide-bg-l' : 'flex-scale-x'">
                <n v-if="screenWidth >= 768 || !isShowConversation"
                    class="w-full h-full md:w-60 flex flex-col gap-2 px-2 md:static absolute">
                    <!-- 搜索框 -->
                    <n class="h-8 flex shrink-0">
                        <input class="flex-1 px-2 bg-gray-100 rounded" type="text" placeholder="搜索">
                    </n>
                    <!-- 列表区域 -->
                    <n class="flex-1 flex flex-col gap-2 overflow-y-auto">
                        <!-- 列表卡片 -->
                        <n v-for="conversation in conversations" :key="conversation.id"
                            @click="isShowConversation = true"
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
                    <!-- 手机版底部的bar导航 -->
                    <transition name="flex-scale-y">
                        <n v-if="screenWidth < 640"
                            class="h-14 flex z-40 bg-white flex-row gap-2 p-2 border-t border-gray-200 justify-between px-10 pt-2 pb-1">
                            <n class="flex flex-col items-center">
                                <FiMessageSquare />
                                <n class="text-xs">会话</n>
                            </n>
                            <n class="flex flex-col items-center">
                                <FiUsers />
                                <n class="text-xs">角色</n>
                            </n>
                            <n class="flex flex-col items-center">
                                <FiMenu />
                                <n class="text-xs">更多</n>
                            </n>
                        </n>
                    </transition>
                </n>
            </transition>
            <!-- 导航内容区 -->
            <transition :name="screenWidth < 768 ? 'slide-fg-r' : 'disable'">
                <n v-if="isShowConversation"
                    class="flex-1 flex flex-col h-screen md:h-full z-50 border-l bg-white border-gray-200 absolute md:static w-full">
                    <!-- 标题栏 -->
                    <n class="flex flex-row px-2 pb-2 border-b border-gray-200">
                        <!-- mr5是为了让标题居中 -->
                        <FiChevronLeft @click="isShowConversation = false"
                            class="w-5 cursor-pointer hover:bg-gray-100 rounded block md:hidden max-sm:mr-5" />
                        <!-- 标题文字 -->
                        <n class="mr-auto ml-auto md:ml-0">猫小咪</n>
                        <!-- 按钮操作区 -->
                        <n class="mr-2 flex gap-2">
                            <VscPin class="w-5 cursor-pointer hover:bg-gray-100 rounded" />
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
            </transition>
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

import {
    VscPin
} from 'vue-icons-plus/vsc';
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
import {
    ref,
    onMounted,
    onUnmounted
} from 'vue';

// 屏幕宽度
const screenWidth = ref(window.innerWidth);

// 是否显示会话信息视图
const isShowConversation = ref(screenWidth.value > 768);

function handleResize() {
    screenWidth.value = window.innerWidth;
    if (screenWidth.value > 768) {
        isShowConversation.value = true;
    }
}

onMounted(() => {
    window.addEventListener('resize', handleResize);
    handleResize(); // 初始化时检查一次
});
onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});

</script>


<style scoped>
/* 前景页面动画 */
.slide-fg-r-enter-active,
.slide-fg-r-leave-active {
    transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1),
        box-shadow-color 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    box-shadow: -1rem 0 2rem rgba(0, 0, 0, 0.05);
}

.slide-fg-r-enter-from {
    transform: translateX(100%);
}

.slide-fg-r-leave-to {
    transform: translateX(100%);
}

/* 背景页面动画 */
.slide-bg-l-enter-active {
    transition: transform 0.5s ease;
}

.slide-bg-l-leave-active {
    transition: transform 0.5s ease;
}

.slide-bg-l-enter-from {
    transform: translateX(-20%);
}

.slide-bg-l-leave-to {
    transform: translateX(-20%);
}

/* flex x轴 宽度动画 */
.flex-scale-x-enter-active,
.flex-scale-x-leave-active {
    transition: width 0.5s ease,
        opacity 0.5s ease;
    overflow: hidden;
}

.flex-scale-x-enter-from,
.flex-scale-x-leave-to {
    width: 0;
    opacity: 0;
}

/* flex y轴 高度动画 */
.flex-scale-y-enter-active,
.flex-scale-y-leave-active {
    transition: height 0.5s ease,
        opacity 0.5s ease;
    overflow: hidden;
}

.flex-scale-y-enter-from,
.flex-scale-y-leave-to {
    height: 0;
    opacity: 0;
}
</style>
