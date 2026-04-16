import {
    defineStore
} from "pinia";

import {
    Component,
    markRaw,
    ref
} from "vue";


export const usePageController = defineStore('pageController', () => {
    const stack = ref<Component[]>([]);

    function push(conmponent: Component) {
        stack.value.push(markRaw(conmponent));
    }

    function pop() {
        stack.value.pop();
    }

    function clear() {
        stack.value = [];
    }

    return {
        stack,
        push,
        pop,
        clear
    };
});