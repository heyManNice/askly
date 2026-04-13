<template>
    <p @click="page.toTopPage()">数据库：回到一级页面</p>
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