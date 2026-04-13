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

    updateApiList();
    return {
        apiList,
        updateApiList,
        addApiToDb,
    };
});