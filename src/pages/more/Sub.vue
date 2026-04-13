<template>
    <MobileAppBar :title="mspc.selected" />
</template>
<script lang="ts" setup>
import MobileAppBar from '@components/MobileAppBar.vue';

import {
    useMoreSubPageController
} from '@stores/more';

const mspc = useMoreSubPageController();
</script>