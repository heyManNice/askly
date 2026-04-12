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

        <!-- 一级内容区域 -->
        <template #top-page="{ page }">
            <Top :page="page" />
        </template>

        <!-- 二级内容区域 -->
        <template #sub-page="{ page }">
            <Sub :page="page" />
        </template>
    </Mountain>
</template>
<script lang="ts" setup>
import Mountain from '@layouts/Mountain.vue';
import DesktopNav from '@components/DesktopNav.vue';
import MobileNav from '@components/MobileNav.vue';
import Top from '@pages/conversations/Top.vue';
import Sub from '@pages/conversations/Sub.vue';
</script>
