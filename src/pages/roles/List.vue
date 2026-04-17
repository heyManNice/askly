<template>
    <n class="flex flex-col gap-2 bg-white dark:bg-black h-full">
        <MobileAppBar title="角色" />

        <!-- 新建角色按钮 -->
        <n @click="roleEditor.openCreateRole()"
            class="h-8 flex shrink-0 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-900 rounded items-center justify-center cursor-pointer mx-2">
            新增角色
        </n>

        <!-- 角色列表区域 -->
        <n class="flex-1 flex flex-col gap-2 overflow-y-auto px-2">
            <n v-if="rolesStore.roleList.length === 0"
                class="text-sm text-gray-500 dark:text-zinc-400 rounded bg-gray-50 dark:bg-zinc-900 p-3">
                暂无角色，点击上方按钮创建。
            </n>

            <n v-for="role in rolesStore.roleList" :key="role.id" @click="roleEditor.openEditRole(role)"
                class="flex items-center gap-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer" :class="{
                    'bg-gray-100 dark:bg-zinc-800': ((pufferStore.morph === 'expanded') && (roleEditor.draftRole?.id === role.id)),
                }">
                <!-- 左侧头像 -->
                <n v-if="getRoleAvatarUrl(role.id)" class="w-10 h-10 rounded overflow-hidden shrink-0">
                    <img class="w-10 h-10 rounded object-cover" :src="getRoleAvatarUrl(role.id)" alt="avatar">
                </n>
                <n v-else
                    class="w-10 h-10 rounded shrink-0 bg-gray-200 dark:bg-zinc-700 text-sm flex items-center justify-center">
                    {{ role.name.slice(0, 1) || '角' }}
                </n>

                <!-- 右侧文本区域 -->
                <n class="flex flex-col flex-1 overflow-hidden">
                    <!-- 上方的名称和修改时间 -->
                    <n class="flex flex-row items-center gap-2">
                        <n class="mr-auto truncate">{{ role.name || '未命名角色' }}</n>
                        <n class="text-xs text-gray-500">{{ new Date(role.updatedAt).toLocaleDateString() }}</n>
                    </n>

                    <!-- 下方的角色摘要 -->
                    <n class="text-xs text-gray-500 truncate">{{ role.description || role.prompts || '暂无描述' }}</n>
                </n>
            </n>
        </n>

        <mobile-nav />
    </n>
</template>
<script lang="ts" setup>
import {
    onBeforeUnmount,
    ref,
    watch
} from 'vue';

import MobileAppBar from '@components/MobileAppBar.vue';

import MobileNav from '@components/MobileNav.vue';

import {
    useRolesStore,
    useRoleEditorStore
} from '@stores/roles';

import {
    usePufferStore
} from '@stores/puffer';

const rolesStore = useRolesStore();
const roleEditor = useRoleEditorStore();
const pufferStore = usePufferStore();

const avatarUrlMap = ref<Record<number, string>>({});

function revokeAvatarUrls() {
    for (const url of Object.values(avatarUrlMap.value)) {
        URL.revokeObjectURL(url);
    }
    avatarUrlMap.value = {};
}

function rebuildAvatarUrls() {
    revokeAvatarUrls();

    const nextMap: Record<number, string> = {};
    for (const role of rolesStore.roleList) {
        if (!role.id) {
            continue;
        }

        if (role.avatar.size > 0) {
            nextMap[role.id] = URL.createObjectURL(role.avatar);
        }
    }

    avatarUrlMap.value = nextMap;
}

function getRoleAvatarUrl(roleId?: number) {
    if (!roleId) {
        return '';
    }

    return avatarUrlMap.value[roleId] ?? '';
}

watch(
    () => rolesStore.roleList,
    () => {
        rebuildAvatarUrls();
    },
    { deep: true, immediate: true }
);

onBeforeUnmount(() => {
    revokeAvatarUrls();
});
</script>
