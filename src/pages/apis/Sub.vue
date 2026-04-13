<template>
    <MobileAppBar />
    <n v-if="aspc.selected" class="p-4 flex flex-col gap-4">
        <n>id: {{ aspc.selected?.id ?? 'new' }}</n>
        <n>
            <n>名称：</n>
            <input :value="aspc.selected?.name">
        </n>
        <n>
            <n>地址：</n>
            <input :value="aspc.selected?.url">
        </n>
        <n>
            <n>密钥：</n>
            <input :value="aspc.selected?.key">
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

const aspc = useApiSubPageController();

function onDelApi() {
    const id = aspc.selected?.id;
    if (!id) return;
    if (confirm('确定要删除这个接口吗？')) {
        apisStore.delApiToDb(id)
        aspc.toApiListPage();
    }
}
</script>