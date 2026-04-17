import {
    defineStore
} from "pinia";
import {
    type Component,
    markRaw,
    ref
} from "vue";

export const usePageStackStore = defineStore('pageStack', () => {
    const stack = ref<Component[]>([]);
    const transition = ref<'pop' | 'push' | 'none'>('push');

    function push(page: Component) {
        if (stack.value.length > 0 && stack.value[stack.value.length - 1] === page) {
            return;
        }

        transition.value = 'push';
        stack.value.push(markRaw(page));
    }

    function pop() {
        transition.value = 'pop';
        stack.value.pop();
    }

    function replace(page: Component) {
        transition.value = 'none';
        stack.value = [markRaw(page)];
    }

    function clear() {
        transition.value = 'pop';
        stack.value = [];
    }

    return {
        stack,
        transition,
        push,
        pop,
        replace,
        clear,
    };
});