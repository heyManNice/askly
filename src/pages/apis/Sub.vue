<template>
    <MobileAppBar :title="aspc.selected?.name || '新建接口'" />
    <n v-if="aspc.selected" class="p-3 flex flex-col gap-3">
        <n class="text-sm text-gray-500 dark:text-zinc-400">接口 ID: {{ aspc.selected?.id ?? '新建接口' }}</n>

        <TextInput v-model="name" label="名称" placeholder="qwen-plus" default-value="qwen-plus" />
        <TextInput v-model="url" label="Base URL" placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
            default-value="https://dashscope.aliyuncs.com/compatible-mode/v1" />
        <TextInput v-model="key" label="API Key" placeholder="sk-..." type="password" />
        <TextInput v-model="model" label="Model" placeholder="qwen-plus" default-value="qwen-plus" />

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

import TextInput from '@components/TextInput.vue';
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
            model.value = '';
            return;
        }

        name.value = selected.name ?? '';
        url.value = selected.url ?? '';
        key.value = selected.key ?? '';
        model.value = selected.model ?? '';
    },
    { immediate: true },
);

function onSaveApi() {
    const n = name.value;
    const u = url.value;
    const k = key.value;
    const m = model.value;

    if (k === '') {
        alert('API Key 不能为空');
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