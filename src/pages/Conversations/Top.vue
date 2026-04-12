<template>
    <!-- 搜索区域 -->
    <n class="h-8 flex shrink-0">
        <!-- 搜索输入框 -->
        <input class="flex-1 px-2 bg-gray-100 rounded" type="text" placeholder="搜索">
    </n>
    <!-- 会话列表区域 -->
    <n class="flex-1 flex flex-col gap-2 overflow-y-auto">
        <n v-for="conversation in conversations" :key="conversation.id" @click="page.toSubPage()"
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

<script lang="ts" setup>
import xiaomi from '@images/xiaomi.jpg';
import doubao from '@images/doubao.jpg';
import gpt from '@images/gpt.jpg';

type PageSwitcher = {
    toTopPage: () => void;
    toSubPage: () => void;
};

const props = defineProps<{
    page: PageSwitcher;
}>();

const page = props.page;

const conversations = [
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