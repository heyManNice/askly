import {
    defineStore
} from "pinia";

import {
    ref
} from "vue";

import {
    usePageController
} from '@layouts/Mountain.controller';



export const useMoreSubPageController = defineStore('moreSubPageController', () => {
    const pageController = usePageController();

    const selected = ref<string | null>(null);

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
        toSubPage,
        toMainPage,
    };
});