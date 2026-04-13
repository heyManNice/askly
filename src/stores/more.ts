import {
    defineStore
} from "pinia";

import {
    ref,
    computed
} from "vue";


import {
    routes
} from '@routes/main';

export const useMoreSubPageController = defineStore('moreSubPageController', () => {
    const selected = ref<string | null>(null);

    const selectedComponent = computed(() => {
        return routes.find(route => route.label === selected.value)?.top || null;
    });

    function toSubPage(name: string) {
        selected.value = name;
    }

    function toMainPage() {
        selected.value = null;
    }

    // 是否显示more页面
    const isShowMorePage = ref(false);

    return {
        isShowMorePage,
        selected,
        selectedComponent,
        toSubPage,
        toMainPage
    };
});