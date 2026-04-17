<template>
    <n class="flex-1 flex flex-col h-full bg-white dark:bg-black">
        <MobileAppBar title="资源" />
        <n class="flex-1">资源</n>
        <mobile-nav />
    </n>
</template>
<script lang="ts" setup>
import MobileAppBar from '@components/MobileAppBar.vue';
import MobileNav from '@components/MobileNav.vue';
</script>