<template>
    <!-- 总容器 -->
    <n class="flex flex-row h-screen">
        <!-- 电脑端导航栏 -->
        <transition name="flex-scale-x">
            <n v-if="screenWidth >= 640"
                class="z-60 bg-white w-15 shrink-0 flex flex-col gap-3 items-center pb-2 md:border-r border-gray-200">
                <!-- 电脑导航插槽 -->
                <slot name="desktop-nav" />
            </n>
        </transition>

        <!-- 导航页面区域 -->
        <n class="flex-1 flex flex-row relative">
            <!-- 列表选项区域 -->
            <transition :name="screenWidth < 768 ? 'slide-bg-l' : 'flex-scale-x'">
                <n v-if="currentPage !== 'content'"
                    class="w-full h-full md:w-60 flex flex-col gap-2 px-2 md:static absolute">
                    <!-- 操作列表插槽 -->
                    <slot name="list-panel" :page="page" />
                    <!-- 手机版导航区 -->
                    <transition name="flex-scale-y">
                        <n v-if="screenWidth < 640"
                            class="h-14 flex z-40 bg-white flex-row gap-2 p-2 border-t border-gray-200 justify-between px-10 pt-2 pb-1">
                            <!-- 手机导航插槽 -->
                            <slot name="mobile-nav" :page="page" />
                        </n>
                    </transition>
                </n>
            </transition>

            <!-- 内容区域 -->
            <transition :name="screenWidth < 768 ? 'slide-fg-r' : 'disable'">
                <n v-if="currentPage !== 'list'"
                    class="flex-1 flex flex-col h-screen md:h-full z-50 border-l bg-white border-gray-200 absolute md:static w-full">
                    <!-- 内容区域插槽 -->
                    <slot name="content-panel" :page="page" />
                </n>
            </transition>
        </n>
    </n>
</template>

<script lang="ts" setup>
import {
    ref,
    onMounted,
    onUnmounted
} from 'vue';


type CurrentPage = 'list' | 'content' | 'both';

const screenWidth = ref(window.innerWidth);
const currentPage = ref<CurrentPage>(screenWidth.value >= 768 ? 'both' : 'list');

function syncLayoutState() {
    screenWidth.value = window.innerWidth;

    if (screenWidth.value >= 768) {
        currentPage.value = 'both';
    }
}

const page = {
    toContent() {
        if (screenWidth.value < 768) {
            currentPage.value = 'content';
        }
    },
    toList() {
        if (screenWidth.value < 768) {
            currentPage.value = 'list';
        }
    }
};

onMounted(() => {
    window.addEventListener('resize', syncLayoutState);
    syncLayoutState();
});

onUnmounted(() => {
    window.removeEventListener('resize', syncLayoutState);
});
</script>

<style scoped>
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
