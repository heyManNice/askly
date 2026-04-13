<template>
    <MobileAppBar :name="aspc.selected?.name || '新建接口'" />
    <n v-if="aspc.selected" class="p-3 flex flex-col gap-3">
        <n class="text-sm text-gray-500 dark:text-zinc-400">接口 ID: {{ aspc.selected?.id ?? '新建接口' }}</n>

        <n class="grid gap-1">
            <n class="text-sm text-gray-500 dark:text-zinc-400">名称</n>
            <input v-model="name" class="h-9 px-2 rounded bg-gray-100 dark:bg-zinc-800 dark:border dark:border-zinc-900"
                placeholder="qwen-plus" />
        </n>

        <n class="grid gap-1">
            <n class="text-sm text-gray-500 dark:text-zinc-400">Base URL</n>
            <input v-model="url" class="h-9 px-2 rounded bg-gray-100 dark:bg-zinc-800 dark:border dark:border-zinc-900"
                placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1" />
        </n>

        <n class="grid gap-1">
            <n class="text-sm text-gray-500 dark:text-zinc-400">API Key</n>
            <input v-model="key" class="h-9 px-2 rounded bg-gray-100 dark:bg-zinc-800 dark:border dark:border-zinc-900"
                placeholder="sk-..." />
        </n>

        <n class="grid gap-1">
            <n class="text-sm text-gray-500 dark:text-zinc-400">Model</n>
            <input v-model="model"
                class="h-9 px-2 rounded bg-gray-100 dark:bg-zinc-800 dark:border dark:border-zinc-900"
                placeholder="qwen-plus" />
        </n>

        <n class="flex gap-2 pt-1">
            <button class="px-3 h-9 rounded bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
                @click="onSaveApi">
                保存
            </button>
            <button v-if="aspc.selected?.id"
                class="px-3 h-9 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 cursor-pointer"
                @click="onDelApi">
                删除
            </button>
        </n>
    </n>

    <n v-else class="p-4 text-sm text-gray-500 dark:text-zinc-400">
        未选择接口。
    </n>
</template>
<script lang="ts" setup>
import {
    ref,
    watch
} from 'vue';

import MobileAppBar from '@components/MobileAppBar.vue';
import {
    useApiSubPageController,
    useApisStore
} from '@stores/apis';

const apisStore = useApisStore();

const aspc = useApiSubPageController();

const name = ref('');
const url = ref('');
const key = ref('');
const model = ref('');

watch(
    () => aspc.selected,
    (selected) => {
        if (!selected) {
            name.value = '';
            url.value = '';
            key.value = '';
            return;
        }

        name.value = selected.name ?? '';
        url.value = selected.url ?? '';
        key.value = selected.key ?? '';
    },
    { immediate: true },
);

function onSaveApi() {
    const n = name.value.trim();
    const u = url.value.trim();
    const k = key.value.trim();
    const m = model.value.trim();

    if (!n || !u) {
        alert('名称和地址不能为空');
        return;
    }

    if (aspc.selected?.id) {
        apisStore.updateApiToDb({
            id: aspc.selected.id,
            name: n,
            url: u,
            key: k,
            model: m,
        });
    } else {
        apisStore.addApiToDb({
            name: n,
            url: u,
            key: k,
            model: m,
        });
    }

    aspc.toApiListPage();
}

function onDelApi() {
    const id = aspc.selected?.id;
    if (!id) return;
    if (confirm('确定要删除这个接口吗？')) {
        apisStore.delApiToDb(id)
        aspc.toApiListPage();
    }
}
</script>