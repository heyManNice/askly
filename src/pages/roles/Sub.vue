<template>
    <MobileAppBar @to-top-page="page.toTopPage()" />
    <p class="px-2">角色</p>
</template>
<script lang="ts" setup>
import type {
    PageSwitcher
} from '@layouts/Mountain.types';
const props = defineProps<{
    page: PageSwitcher;
}>();

const page = props.page;

import MobileAppBar from '@components/MobileAppBar.vue';
</script>