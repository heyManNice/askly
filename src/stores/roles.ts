import {
    defineStore
} from 'pinia';

import {
    ref
} from 'vue';

import {
    roles,
    type DBKey
} from '@databases/main';

export const useRolesStore = defineStore('roles', () => {
    const roleList = ref<DBKey<typeof roles>[]>([]);

    async function refreshRoles() {
        roleList.value = await roles.toArray();
    }

    async function addRole(role: {
        name: string;
        avatar: Blob;
        description: string;
        apiId: number;
        prompts: string;
        temperature: number;
        contextLimit: number;
        outputLimit: number;
    }) {
        await roles.add({
            name: role.name,
            avatar: role.avatar,
            description: role.description,
            apiId: role.apiId,
            prompts: role.prompts,
            temperature: role.temperature,
            contextLimit: role.contextLimit,
            outputLimit: role.outputLimit,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await refreshRoles();
    }

    async function updateRole(role: {
        id: number;
        name: string;
        avatar: Blob;
        description: string;
        apiId: number;
        prompts: string;
        temperature: number;
        contextLimit: number;
        outputLimit: number;
    }) {
        await roles.update(role.id, {
            name: role.name,
            avatar: role.avatar,
            description: role.description,
            apiId: role.apiId,
            prompts: role.prompts,
            temperature: role.temperature,
            contextLimit: role.contextLimit,
            outputLimit: role.outputLimit,
            updatedAt: new Date(),
        });

        await refreshRoles();
    }

    async function deleteRole(id: number) {
        await roles.delete(id);
        await refreshRoles();
    }

    refreshRoles();

    return {
        roleList,
        refreshRoles,
        addRole,
        updateRole,
        deleteRole,
    };
});

import {
    usePageStackStore
} from '@stores/pageStack';

import RolesSet from '@pages/roles/Set.vue';

export const useRoleEditorStore = defineStore('roleEditor', () => {
    const pageStack = usePageStackStore();
    const draftRole = ref<DBKey<typeof roles> | null>(null);

    function openCreateRole() {
        draftRole.value = {
            name: '',
            avatar: new Blob([], { type: 'application/octet-stream' }),
            description: '',
            apiId: 0,
            prompts: '',
            temperature: 0.7,
            contextLimit: 20,
            outputLimit: 2048,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        pageStack.push(RolesSet);
    }

    function openEditRole(role: DBKey<typeof roles>) {
        draftRole.value = role;
        pageStack.push(RolesSet);
    }

    return {
        draftRole,
        openCreateRole,
        openEditRole,
    };
});