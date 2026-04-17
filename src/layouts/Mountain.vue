<template>
    <!-- 总容器 -->
    <n class="flex flex-row h-screen dark:text-zinc-200">
        <!-- 电脑端导航栏 -->
        <transition name="flex-scale-x">
            <n v-if="pufferStore.morph !== 'compact'"
                class="z-60 bg-white dark:bg-black w-15 shrink-0 flex flex-col gap-3 items-center pb-2">
                <!-- 电脑导航插槽 -->
                <slot name="desktop-nav" />
            </n>
        </transition>
        <n class="flex flex-col flex-1">
            <!-- 导航页面区域 -->
            <n class="flex-1 flex flex-row">
                <!-- 电脑布局左侧显示栈底页面 -->
                <transition name="flex-scale-x">
                    <n class="flex flex-col w-60 border-l dark:border-zinc-900 border-gray-200"
                        v-if="pufferStore.morph === 'expanded'">
                        <component :is="pageController.stack[0]" />
                    </n>
                </transition>

                <n class="flex flex-col flex-1 relative border-l dark:border-zinc-900 border-gray-200">
                    <!-- 手机和电脑显示栈顶页面 -->
                    <!-- 显示栈顶新旧切换动画 -->
                    <transition
                        :name="pufferStore.morph === 'expanded' ? 'disable' : `page-${pageController.animationType}-slide`">
                        <component
                            v-if="(pageController.stack.length > 0 && pufferStore.morph !== 'expanded') || pageController.stack.length > 1"
                            :is="pageController.stack[pageController.stack.length - 1]" />
                    </transition>
                </n>
            </n>
        </n>
    </n>
</template>

<script lang="ts" setup>
import {
    usePufferStore
} from '@stores/puffer';

const pufferStore = usePufferStore();

import {
    usePageController
} from '@pages/controller';
const pageController = usePageController();

import ConversationList from '@pages/conversations/List.vue';
pageController.push(ConversationList);
</script>

<style scoped>
.page-pop-slide-leave-active,
.page-push-slide-enter-active {
    transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1),
        box-shadow-color 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    box-shadow: -1rem 0 2rem rgba(0, 0, 0, 0.05);
    position: absolute;
    width: 100%;
}

.page-push-slide-leave-active,
.page-pop-slide-enter-active {
    transition: transform 0.5s ease;
    position: absolute;
    width: 100%;
}

/* 页面管理器push的时候的动画 */
/* 新增的从右侧切入，z顶层，原来的从左侧消失 */
.page-push-slide-enter-from {
    transform: translateX(100%);
    z-index: 10;
}

.page-push-slide-leave-to {
    transform: translateX(-20%);
}

/* 页面管理器pop的时候的动画 */
/* 旧的从原位消失，新增的从左侧切入 */
.page-pop-slide-enter-from {
    transform: translateX(-20%);
}

.page-pop-slide-leave-to {
    transform: translateX(100%);
    z-index: 10;
}

/* flex x轴缩小动画 */
.flex-scale-x-enter-active,
.flex-scale-x-leave-active {
    transition: width 0.5s ease;
    overflow: hidden;
}

.flex-scale-x-enter-from,
.flex-scale-x-leave-to {
    width: 0;
}
</style>
