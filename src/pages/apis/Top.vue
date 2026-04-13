<template>
    <!-- 新建接口按钮 -->
    <n @click="selectedApiStore.createApi()"
        class="h-8 flex shrink-0 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-900 rounded items-center justify-center cursor-pointer mx-2">
        新增接口
    </n>
    <n class="flex-1 flex flex-col gap-2 overflow-y-auto px-2">
        <n v-for="api in apisStore.apiList" @click="selectedApiStore.selectApi(api)"
            class="flex flex-col rounded hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer" :class="{
                'bg-gray-100 dark:bg-zinc-800': selectedApiStore.selectedApi?.id === api.id,
            }">
            <!-- 上方的名称和修改时间 -->
            <n class="flex flex-row">
                <n class="mr-auto">{{ api.name }}</n>
                <n class="text-xs text-gray-500">{{ new Date(api.updatedAt).toLocaleDateString() }}</n>
            </n>
            <!-- 下方的地址 -->
            <n class="text-xs text-gray-500">{{ api.url }}</n>
        </n>
    </n>
</template>
<script lang="ts" setup>
import {
    useApisStore,
    useSelectedApiStore
} from '@stores/apis';
const apisStore = useApisStore();
const selectedApiStore = useSelectedApiStore();
</script>