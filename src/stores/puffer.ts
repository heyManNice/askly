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

    // 手机导航栏图标显示的数量
    const mobileNavIconCount = computed(() => {
        if (screenWidth.value < 340)
            return 2;
        else if (screenWidth.value < 440)
            return 3;
        else
            return 4;
    });

    return {
        screenWidth,
        morph,
        mobileNavIconCount,
        onResize,
    };
});