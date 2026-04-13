import {
    defineStore
} from "pinia";

import {
    ref,
    computed
} from "vue";

import {
    usePageController
} from '@layouts/Mountain.controller';

import {
    routes
} from '@routes/main';



export const useMoreSubPageController = defineStore('moreSubPageController', () => {
    const pageController = usePageController();

    const selected = ref<string | null>(null);

    const selectedComponent = computed(() => {
        return routes.find(route => route.label === selected.value)?.top || null;
    });

    function toSubPage(name: string) {
        selected.value = name;
        pageController.toSubPage();
    }

    function toMainPage() {
        selected.value = null;
        pageController.toTopPage();
    }

    return {
        selected,
        selectedComponent,
        toSubPage,
        toMainPage
    };
});