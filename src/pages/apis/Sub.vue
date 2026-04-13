<template>
    <MobileAppBar />
    <n v-if="selectedApiStore.selectedApi" class="p-4 flex flex-col gap-4">
        <n>id: {{ selectedApiStore.selectedApi?.id ?? 'new' }}</n>
        <n>
            <n>名称：</n>
            <input :value="selectedApiStore.selectedApi?.name">
        </n>
        <n>
            <n>地址：</n>
            <input :value="selectedApiStore.selectedApi?.url">
        </n>
        <n>
            <n>密钥：</n>
            <input :value="selectedApiStore.selectedApi?.key">
        </n>
        <button>保存</button>
        <button @click="onDelApi">删除</button>
    </n>
</template>
<script lang="ts" setup>
import MobileAppBar from '@components/MobileAppBar.vue';
import {
    usePageController
} from '@layouts/Mountain.controller';
import {
    useSelectedApiStore, useApisStore
} from '@stores/apis';

const pageController = usePageController();
const apisStore = useApisStore();
const selectedApiStore = useSelectedApiStore();

function onDelApi() {
    const id = selectedApiStore.selectedApi?.id;
    if (!id) return;
    if (confirm('确定要删除这个接口吗？')) {
        apisStore.delApiToDb(id)
        selectedApiStore.selectedApi = null;
        pageController.toTopPage();
    }
}
</script>