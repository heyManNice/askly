<template>
    <p @click="pageController.toTopPage()">资源：回到一级页面</p>
</template>
<script lang="ts" setup>
import {
    usePageController
} from '@layouts/Mountain.controller';
const pageController = usePageController();
</script>