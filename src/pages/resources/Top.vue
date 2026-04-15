<template>
    <n class="flex-1">
        <p @click="pageController.pushPage(buildRouteSubPage(selectedRoute))">资源：去二级页面</p>
    </n>
</template>
<script lang="ts" setup>
import {
    buildRouteSubPage,
    usePageController
} from '@layouts/Mountain.controller';

import {
    selectedRoute
} from '@routes/main';

const pageController = usePageController();
</script>