import {
    defineStore
} from "pinia";
import {
    ref,
    computed,
    onScopeDispose
} from "vue";

const BP = {
    'sm': 640,
    'md': 768,
    'lg': 1024,
    'xl': 1280,
    '2xl': 1536
} as const;

export const usePufferStore = defineStore('puffer', () => {
    const screenWidth = ref(window.innerWidth);

    const morph = computed(() => {
        if (screenWidth.value < BP.sm) {
            return 'compact';
        } else if (screenWidth.value < BP.md) {
            return 'medium';
        } else {
            return 'expanded';
        }
    });

    const onResizeQueue: Array<(m: typeof morph.value) => void> = [];

    function onResize(callback: typeof onResizeQueue[number]) {
        onResizeQueue.push(callback);
    }

    function updateScreenWidth() {
        screenWidth.value = window.innerWidth;
        onResizeQueue.forEach(callback => callback(morph.value));
    }

    window.addEventListener('resize', updateScreenWidth);
    onScopeDispose(() => {
        window.removeEventListener('resize', updateScreenWidth);
    });

    return {
        screenWidth,
        morph,
        onResize,
    };
});