<template>
    <!-- 总容器 -->
    <n class="flex flex-row h-screen">
        <!-- 边栏导航 -->
        <n class="w-15 shrink-0 flex flex-col gap-5 items-center pb-5">
            <!-- 头像 -->
            <img class="w-10 rounded" :src="avatar" alt="avatar">
            <!-- 操作按钮区 -->
            <n class="flex-1 flex flex-col gap-4">
                <FiMessageSquare class="cursor-pointer " />
                <FiUsers class="cursor-pointer " />
                <FiServer class="cursor-pointer" />
                <FiBox class="cursor-pointer" />
            </n>
            <!-- 菜单按钮区 -->
            <n>
                <FiMenu class="cursor-pointer" />
            </n>
        </n>
        <!-- 导航内容区 -->
        <n class="flex-1 flex flex-row">
            <!-- 导航列表区 -->
            <n class="w-60"></n>
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
    FiBox
} from 'vue-icons-plus/fi';

</script>
