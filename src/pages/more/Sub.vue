<template>
    <MobileAppBar :title="mspc.selected ?? '详情'" />
    <n class="flex-1 flex flex-col gap-2">
        <component :is="mspc.selectedComponent" v-if="mspc.selectedComponent" />
    </n>
</template>
<script lang="ts" setup>
import MobileAppBar from '@components/MobileAppBar.vue';

import {
    useMoreSubPageController
} from '@stores/more';

const mspc = useMoreSubPageController();
</script>