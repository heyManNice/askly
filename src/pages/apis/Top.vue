<template>
    <n class="flex-1">
        <p @click="pageController.toSubPage()">接口：去二级页面</p>
    </n>
</template>
<script lang="ts" setup>
import {
    usePageController
} from '@layouts/Mountain.controller';
const pageController = usePageController();
</script>