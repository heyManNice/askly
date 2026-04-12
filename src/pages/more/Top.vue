<template>
    <n class="flex-1">
        <p @click="page.toSubPage()">更多去二级页面</p>
    </n>
</template>
<script lang="ts" setup>
import type {
    PageSwitcher
} from '@layouts/Mountain.types';
const props = defineProps<{
    page: PageSwitcher;
}>();

const page = props.page;
</script>