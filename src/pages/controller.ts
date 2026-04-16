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

    // 记录动画类型
    const animationType = ref<'pop' | 'push'>('push');

    function push(conmponent: Component) {
        // 如果栈顶和当前页面相同，就不压入新页面了
        if (stack.value.length > 0 && stack.value[stack.value.length - 1] === conmponent) {
            return;
        }
        animationType.value = 'push';
        stack.value.push(markRaw(conmponent));
    }

    function pop() {
        animationType.value = 'pop';
        stack.value.pop();
    }

    function clear() {
        animationType.value = 'pop';
        stack.value = [];
    }

    return {
        stack,
        push,
        pop,
        clear,
        animationType
    };
});