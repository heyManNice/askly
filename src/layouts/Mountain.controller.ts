import {
    defineStore
} from "pinia";
import {
    ref
} from "vue";


import {
    usePufferStore
} from '@stores/puffer';


type CurrentPage = 'top-page' | 'sub-page' | 'both-page';

export const usePageController = defineStore('pageController', () => {
    const pufferStore = usePufferStore();
    const currentPage = ref<CurrentPage>(pufferStore.morph === 'expanded' ? 'both-page' : 'top-page');

    function toTopPage() {
        if (pufferStore.morph !== 'expanded') {
            currentPage.value = 'top-page';
        }
    }

    function toSubPage() {
        if (pufferStore.morph !== 'expanded') {
            currentPage.value = 'sub-page';
        }
    }

    return {
        currentPage,
        toTopPage,
        toSubPage
    }
});