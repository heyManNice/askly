<template>
    <n class="flex flex-col gap-2 bg-white dark:bg-black h-full">
        <MobileAppBar title="接口" />
        <!-- 新建接口按钮 -->
        <n @click="apiEditor.openCreateApi()"
            class="h-8 flex shrink-0 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-900 rounded items-center justify-center cursor-pointer mx-2">
            新增接口
        </n>
        <n class="flex-1 flex flex-col gap-2 overflow-y-auto px-2">
            <n v-for="api in apisStore.apiList" @click="apiEditor.openEditApi(api)"
                class="flex flex-col rounded hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer" :class="{
                    'bg-gray-100 dark:bg-zinc-800': ((pufferStore.morph === 'expanded') && (apiEditor.draftApi?.id === api.id)),
                }">
                <!-- 上方的名称和修改时间 -->
                <n class="flex flex-row">
                    <n class="mr-auto truncate">{{ api.name }}</n>
                    <n class="text-xs text-gray-500">{{ new Date(api.updatedAt).toLocaleDateString() }}</n>
                </n>
                <!-- 下方的地址 -->
                <n class="text-xs text-gray-500 truncate">{{ api.url }}</n>
            </n>
        </n>
        <mobile-nav />
    </n>
</template>
<script lang="ts" setup>
import {
    useApisStore,
    useApiEditorStore
} from '@stores/apis';

import MobileAppBar from '@src/components/MobileAppBar.vue';

import {
    usePufferStore
} from '@src/stores/puffer';

import MobileNav from '@components/MobileNav.vue';

const apisStore = useApisStore();
const apiEditor = useApiEditorStore();
const pufferStore = usePufferStore();
</script>