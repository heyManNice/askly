import {
    defineStore
} from "pinia";

import {
    ref
} from "vue";

import {
    apis,
    type DBKey
} from '@databases/main';

export const useApisStore = defineStore('apis', () => {
    const apiList = ref<DBKey<typeof apis>[]>([]);

    async function refreshApis() {
        apiList.value = await apis.toArray();
    }

    async function addApi(api: {
        name: string;
        url: string;
        key: string;
        model: string;
    }) {
        await apis.add({
            name: api.name,
            url: api.url,
            key: api.key,
            model: api.model,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await refreshApis();
    }

    async function updateApi(api: {
        id: number;
        name: string;
        url: string;
        key: string;
        model: string;
    }) {
        await apis.update(api.id, {
            name: api.name,
            url: api.url,
            key: api.key,
            model: api.model,
            updatedAt: new Date(),
        });

        await refreshApis();
    }

    async function deleteApi(id: number) {
        await apis.delete(id);
        await refreshApis();
    }

    refreshApis();
    return {
        apiList,
        refreshApis,
        addApi,
        updateApi,
        deleteApi,
    };
});

import {
    usePageStackStore
} from '@stores/pageStack';

import ApisSet from '@pages/apis/Set.vue';

export const useApiEditorStore = defineStore('apiEditor', () => {
    const pageStack = usePageStackStore();
    const draftApi = ref<DBKey<typeof apis> | null>(null);

    function openCreateApi() {
        draftApi.value = {
            name: '',
            url: '',
            key: '',
            model: '',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        pageStack.push(ApisSet);
    }

    function openEditApi(api: DBKey<typeof apis>) {
        draftApi.value = api;
        pageStack.push(ApisSet);
    }

    return {
        draftApi,
        openCreateApi,
        openEditApi,
    };
});