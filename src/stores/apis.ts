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
        model: string;
    }) {
        apis.add({
            name: api.name,
            url: api.url,
            key: api.key,
            model: api.model,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).then(() => {
            updateApiList();
        });
    }

    // 更新一个api
    function updateApiToDb(api: {
        id: number;
        name: string;
        url: string;
        key: string;
        model: string;
    }) {
        apis.update(api.id, {
            name: api.name,
            url: api.url,
            key: api.key,
            model: api.model,
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
        updateApiToDb,
        delApiToDb,
    };
});

import {
    usePageController
} from '@pages/controller';

import ApisSet from '@pages/apis/Set.vue';

// api二级页面控制器
export const useApiSubPageController = defineStore('apiSubPageController', () => {
    const pageController = usePageController();
    const selected = ref<DBKey<typeof apis> | null>(null);

    function toCreateApiPage() {
        selected.value = {
            name: '',
            url: '',
            key: '',
            model: '',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        pageController.push(ApisSet);
    }

    function toEditApiPage(api: DBKey<typeof apis>) {
        selected.value = api;
        pageController.push(ApisSet);
    }
    return {
        selected,
        toCreateApiPage,
        toEditApiPage
    };
});