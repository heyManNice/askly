<template>
    <n class="flex flex-col gap-2 bg-white dark:bg-black h-full">
        <MobileAppBar :title="apiEditor.draftApi?.name || '新建接口'" />
        <n v-if="apiEditor.draftApi" class="p-3 flex flex-col gap-3">
            <n class="text-sm text-gray-500 dark:text-zinc-400">接口 ID: {{ apiEditor.draftApi?.id ?? '新建接口' }}</n>

            <TextInput v-model="name" label="名称" placeholder="qwen-plus" default-value="qwen-plus" />
            <TextInput v-model="url" label="Base URL" placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
                default-value="https://dashscope.aliyuncs.com/compatible-mode/v1" />
            <TextInput v-model="key" label="API Key" placeholder="sk-..." type="password" />
            <TextInput v-model="model" label="Model" placeholder="qwen-plus" default-value="qwen-plus" />

            <n class="flex gap-2 pt-1">
                <button
                    class="px-3 h-9 rounded bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
                    @click="onSaveApi">
                    保存
                </button>
                <button v-if="apiEditor.draftApi?.id"
                    class="px-3 h-9 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 cursor-pointer"
                    @click="onDelApi">
                    删除
                </button>
            </n>
        </n>

        <n v-else class="p-4 text-sm text-gray-500 dark:text-zinc-400">
            未选择接口。
        </n>
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
    useApiEditorStore,
    useApisStore
} from '@stores/apis';
import {
    usePageStackStore
} from '@stores/pageStack';
const pageStack = usePageStackStore();

const apisStore = useApisStore();

const apiEditor = useApiEditorStore();

const name = ref('');
const url = ref('');
const key = ref('');
const model = ref('');

watch(
    () => apiEditor.draftApi,
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

async function onSaveApi() {
    const n = name.value;
    const u = url.value;
    const k = key.value;
    const m = model.value;

    if (k === '') {
        alert('API Key 不能为空');
        return;
    }

    if (apiEditor.draftApi?.id) {
        await apisStore.updateApi({
            id: apiEditor.draftApi.id,
            name: n,
            url: u,
            key: k,
            model: m,
        });
    } else {
        await apisStore.addApi({
            name: n,
            url: u,
            key: k,
            model: m,
        });
    }
    pageStack.pop();
}

async function onDelApi() {
    const id = apiEditor.draftApi?.id;
    if (!id) return;
    if (confirm('确定要删除这个接口吗？')) {
        await apisStore.deleteApi(id);
        pageStack.pop();
    }
}
</script>