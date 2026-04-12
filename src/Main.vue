<template>
    <Mountain>
        <!-- 电脑版导航栏 -->
        <template #desktop-nav>
            <DesktopNav />
        </template>

        <!-- 手机版导航栏 -->
        <template #mobile-nav>
            <MobileNav />
        </template>

        <!-- 页面列表区域 -->
        <template #top-page="{ page }">
            <!-- 会话页面组件（一级面板） -->
            <Conversations panel="top-page" :page="page" />
        </template>

        <!-- 内容区域 -->
        <template #sub-page="{ page }">
            <!-- 会话页面组件（二级面板） -->
            <Conversations panel="sub-page" :page="page" />
        </template>
    </Mountain>
</template>
<script lang="ts" setup>
import Mountain from '@layouts/Mountain.vue';
import DesktopNav from '@components/DesktopNav.vue';
import MobileNav from '@components/MobileNav.vue';
import Conversations from '@pages/Conversations.vue';
</script>
