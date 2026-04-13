<template>
    <MobileAppBar />
    <n v-if="selected" class="p-4 flex flex-col gap-4">
        <n>id: {{ selected?.id ?? 'new' }}</n>
        <n>
            <n>名称：</n>
            <input :value="selected?.name">
        </n>
        <n>
            <n>地址：</n>
            <input :value="selected?.url">
        </n>
        <n>
            <n>密钥：</n>
            <input :value="selected?.key">
        </n>
        <button>保存</button>
        <button @click="onDelApi">删除</button>
    </n>
</template>
<script lang="ts" setup>
import MobileAppBar from '@components/MobileAppBar.vue';
import {
    useApiSubPageController,
    useApisStore
} from '@stores/apis';

const apisStore = useApisStore();

const {
    selected,
    toApiListPage
} = useApiSubPageController();

function onDelApi() {
    const id = selected?.id;
    if (!id) return;
    if (confirm('确定要删除这个接口吗？')) {
        apisStore.delApiToDb(id)
        toApiListPage();
    }
}
</script>