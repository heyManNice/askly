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

    // 更新api列表
    async function updateApiList() {
        apiList.value = await apis.toArray()
    }

    // 添加api
    function addApiToDb(api: {
        name: string;
        url: string;
        key: string;
    }) {
        apis.add({
            name: api.name,
            url: api.url,
            key: api.key,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).then(() => {
            updateApiList();
        });
    }

    // 删除一个api
    function delApiToDb(id: number) {
        apis.delete(id).then(() => {
            updateApiList();
        });
    }

    updateApiList();
    return {
        apiList,
        updateApiList,
        addApiToDb,
        delApiToDb,
    };
});

import {
    usePageController
} from '@layouts/Mountain.controller';

// 选中api
export const useSelectedApiStore = defineStore('selectedApi', () => {
    const pageController = usePageController();
    const selectedApi = ref<DBKey<typeof apis> | null>(null);
    // 选中一个api
    function selectApi(api: DBKey<typeof apis>) {
        selectedApi.value = api;
        pageController.toSubPage();
    }
    // 新建一个api
    function createApi() {
        selectedApi.value = {
            name: '',
            url: '',
            key: '',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        pageController.toSubPage();
    }
    return {
        selectedApi,
        selectApi,
        createApi,
    };
});