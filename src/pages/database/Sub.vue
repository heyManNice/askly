<template>
    <p @click="pageController.toTopPage()">数据库：回到一级页面</p>
</template>
<script lang="ts" setup>
import {
    usePageController
} from '@layouts/Mountain.controller';
const pageController = usePageController();
</script>