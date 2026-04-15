import {
    defineStore
} from "pinia";

import {
    Component,
    ref
} from "vue";


export const usePageController = defineStore('pageController', () => {
    const stack = ref<Component[]>([]);

    function push(conmponent: Component) {
        stack.value.push(conmponent);
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