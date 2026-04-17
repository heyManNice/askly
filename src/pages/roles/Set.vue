<template>
    <n class="flex flex-col gap-2 bg-white dark:bg-black h-full">
        <MobileAppBar :title="roleEditor.draftRole?.name || '新建角色'" />

        <!-- 角色设置表单 -->
        <n v-if="roleEditor.draftRole" class="p-3 flex flex-col gap-3 overflow-y-auto">
            <!-- 角色基础信息 -->
            <n class="text-sm text-gray-500 dark:text-zinc-400">角色 ID: {{ roleEditor.draftRole?.id ?? '新建角色' }}</n>

            <TextInput v-model="name" label="名称" placeholder="例如：默认助手" default-value="默认助手" />
            <TextInput v-model="description" label="描述" placeholder="角色简介" />

            <!-- 角色使用的接口 -->
            <label class="grid gap-1">
                <span class="text-sm text-gray-500 dark:text-zinc-400">使用接口</span>
                <select v-model.number="apiId"
                    class="h-9 px-2 rounded bg-gray-100 dark:bg-zinc-800 dark:border dark:border-zinc-900">
                    <option :value="0" disabled>请选择接口</option>
                    <option v-for="api in apisStore.apiList" :key="api.id" :value="api.id">
                        {{ api.name }}
                    </option>
                </select>
            </label>

            <n v-if="apisStore.apiList.length === 0" class="text-xs text-orange-600 dark:text-orange-400">
                还没有可用接口，请先在接口页面新增一个接口。
            </n>

            <!-- 系统提示词 -->
            <label class="grid gap-1">
                <span class="text-sm text-gray-500 dark:text-zinc-400">提示词</span>
                <textarea v-model="prompts" rows="6" placeholder="你是一个可靠的 AI 助手..."
                    class="px-2 py-2 rounded bg-gray-100 dark:bg-zinc-800 dark:border dark:border-zinc-900 resize-y min-h-24"></textarea>
            </label>

            <!-- 数值参数 -->
            <n class="grid grid-cols-3 gap-2">
                <label class="grid gap-1">
                    <span class="text-sm text-gray-500 dark:text-zinc-400">随机度</span>
                    <input v-model.number="temperature" type="number" min="0" max="2" step="0.1"
                        class="h-9 px-2 rounded bg-gray-100 dark:bg-zinc-800 dark:border dark:border-zinc-900" />
                </label>

                <label class="grid gap-1">
                    <span class="text-sm text-gray-500 dark:text-zinc-400">上下文条数</span>
                    <input v-model.number="contextLimit" type="number" min="1" step="1"
                        class="h-9 px-2 rounded bg-gray-100 dark:bg-zinc-800 dark:border dark:border-zinc-900" />
                </label>

                <label class="grid gap-1">
                    <span class="text-sm text-gray-500 dark:text-zinc-400">输出长度</span>
                    <input v-model.number="outputLimit" type="number" min="64" step="64"
                        class="h-9 px-2 rounded bg-gray-100 dark:bg-zinc-800 dark:border dark:border-zinc-900" />
                </label>
            </n>

            <!-- 头像上传 -->
            <label class="grid gap-1">
                <span class="text-sm text-gray-500 dark:text-zinc-400">头像</span>
                <input type="file" accept="image/*" @change="onChangeAvatar"
                    class="h-9 px-2 rounded bg-gray-100 dark:bg-zinc-800 dark:border dark:border-zinc-900 file:mr-2 file:border-0 file:bg-transparent" />
            </label>

            <img v-if="avatarPreview" :src="avatarPreview" alt="avatar"
                class="w-16 h-16 rounded object-cover border border-gray-200 dark:border-zinc-700" />

            <!-- 操作按钮 -->
            <n class="flex gap-2 pt-1">
                <button
                    class="px-3 h-9 rounded bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
                    @click="onSaveRole">
                    保存
                </button>

                <button v-if="roleEditor.draftRole?.id"
                    class="px-3 h-9 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 cursor-pointer"
                    @click="onDelRole">
                    删除
                </button>
            </n>
        </n>

        <n v-else class="p-4 text-sm text-gray-500 dark:text-zinc-400">
            未选择角色。
        </n>
    </n>
</template>
<script lang="ts" setup>
import {
    ref,
    watch,
    onBeforeUnmount
} from 'vue';

import MobileAppBar from '@components/MobileAppBar.vue';

import TextInput from '@components/TextInput.vue';

import {
    useRoleEditorStore,
    useRolesStore
} from '@stores/roles';

import {
    useApisStore
} from '@stores/apis';

import {
    usePageStackStore
} from '@stores/pageStack';

const pageStack = usePageStackStore();

const rolesStore = useRolesStore();
const roleEditor = useRoleEditorStore();
const apisStore = useApisStore();

const name = ref('');
const description = ref('');
const apiId = ref(0);
const prompts = ref('');
const temperature = ref(0.7);
const contextLimit = ref(20);
const outputLimit = ref(2048);
const avatarBlob = ref<Blob>(new Blob([], { type: 'application/octet-stream' }));
const avatarPreview = ref('');

function updateAvatarPreview(blob: Blob) {
    if (avatarPreview.value) {
        URL.revokeObjectURL(avatarPreview.value);
    }
    avatarPreview.value = blob.size > 0 ? URL.createObjectURL(blob) : '';
}

watch(
    () => roleEditor.draftRole,
    (selected) => {
        if (!selected) {
            name.value = '';
            description.value = '';
            apiId.value = 0;
            prompts.value = '';
            temperature.value = 0.7;
            contextLimit.value = 20;
            outputLimit.value = 2048;
            avatarBlob.value = new Blob([], { type: 'application/octet-stream' });
            updateAvatarPreview(avatarBlob.value);
            return;
        }

        name.value = selected.name ?? '';
        description.value = selected.description ?? '';
        apiId.value = Number.isFinite(selected.apiId) ? selected.apiId : 0;
        prompts.value = selected.prompts ?? '';
        temperature.value = Number.isFinite(selected.temperature) ? selected.temperature : 0.7;
        contextLimit.value = Number.isFinite(selected.contextLimit) ? selected.contextLimit : 20;
        outputLimit.value = Number.isFinite(selected.outputLimit) ? selected.outputLimit : 2048;
        avatarBlob.value = selected.avatar ?? new Blob([], { type: 'application/octet-stream' });
        updateAvatarPreview(avatarBlob.value);
    },
    { immediate: true }
);

watch(
    () => apisStore.apiList,
    (list) => {
        if (apiId.value > 0) {
            return;
        }

        const firstApi = list[0];
        if (firstApi?.id) {
            apiId.value = firstApi.id;
        }
    },
    { immediate: true }
);

onBeforeUnmount(() => {
    if (avatarPreview.value) {
        URL.revokeObjectURL(avatarPreview.value);
    }
});

function normalizeTemperature(value: number) {
    if (!Number.isFinite(value)) {
        return 0.7;
    }
    return Math.max(0, Math.min(2, value));
}

function normalizePositiveInteger(value: number, fallback: number) {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    const normalized = Math.floor(value);
    return normalized > 0 ? normalized : fallback;
}

function onChangeAvatar(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
        return;
    }

    avatarBlob.value = file;
    updateAvatarPreview(avatarBlob.value);
}

async function onSaveRole() {
    const roleName = name.value.trim();
    if (roleName === '') {
        alert('角色名称不能为空');
        return;
    }

    if (apiId.value <= 0) {
        alert('请选择一个接口');
        return;
    }

    const payload = {
        name: roleName,
        avatar: avatarBlob.value,
        description: description.value.trim(),
        apiId: normalizePositiveInteger(Number(apiId.value), 0),
        prompts: prompts.value.trim(),
        temperature: normalizeTemperature(Number(temperature.value)),
        contextLimit: normalizePositiveInteger(Number(contextLimit.value), 20),
        outputLimit: normalizePositiveInteger(Number(outputLimit.value), 2048),
    };

    if (roleEditor.draftRole?.id) {
        await rolesStore.updateRole({
            id: roleEditor.draftRole.id,
            ...payload,
        });
    } else {
        await rolesStore.addRole(payload);
    }

    pageStack.pop();
}

async function onDelRole() {
    const id = roleEditor.draftRole?.id;
    if (!id) return;

    if (confirm('确定要删除这个角色吗？')) {
        await rolesStore.deleteRole(id);
        pageStack.pop();
    }
}
</script>