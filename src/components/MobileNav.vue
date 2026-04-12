<template>
    <!-- 导航图标 -->
    <TransitionGroup name="slide">
        <n v-for="(route, i) in routes.slice(0, navIconCount)" :key="route.id"
            class="flex flex-col items-center cursor-pointer w-15" :class="{
                'text-blue-400': i === selectedRoute
            }" @click="selectedRoute = i">
            <component :is="route.icon" />
            <n class="text-xs">{{ route.label }}</n>
        </n>
    </TransitionGroup>
    <!-- 额外的导航项 -->
    <n class="flex flex-col items-center cursor-pointer w-15">
        <FiMenu />
        <n class="text-xs">更多</n>
    </n>
</template>

<script lang="ts" setup>
import {
    FiMenu,
} from 'vue-icons-plus/fi';

import {
    routes,
    selectedRoute
} from '@routes/main';

import {
    ref,
    onMounted,
    onUnmounted
} from 'vue';

const srceenWidth = ref(window.innerWidth);

// 获取导航图标数量
function getNavIconCount() {
    const length = routes.length;
    if (srceenWidth.value < 340)
        return 2;
    else if (srceenWidth.value < 440)
        return 3;
    else
        return 4;
}

// 导航图标数量
const navIconCount = ref(getNavIconCount());

function updateScreenWidth() {
    srceenWidth.value = window.innerWidth;
    navIconCount.value = getNavIconCount();
}
onMounted(() => {
    window.addEventListener('resize', updateScreenWidth);
});
onUnmounted(() => {
    window.removeEventListener('resize', updateScreenWidth);
});
</script>
<style scoped>
.slide-enter-active,
.slide-leave-active {
    transition: transform 0.35s ease, opacity 0.35s ease;
    transform-origin: center;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    transform: scaleX(0.8) translateY(6px);
}
</style>