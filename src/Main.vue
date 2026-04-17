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
    </Mountain>
</template>
<script lang="ts" setup>
import Mountain from '@layouts/Mountain.vue';
import DesktopNav from '@components/DesktopNav.vue';
import MobileNav from '@components/MobileNav.vue';

import {
    initializeNavigation
} from '@routes/main';

import {
    useChatStore
} from '@stores/chat';

initializeNavigation();

const chatStore = useChatStore();
void chatStore.initialize();
</script>
