import {
    defineStore
} from "pinia";
import {
    computed,
    markRaw,
    ref,
    type Component
} from "vue";


import {
    routes,
    selectedRoute
} from '@routes/main';

import {
    usePufferStore
} from '@stores/puffer';


type StackTransitionAction = 'none' | 'push' | 'pop';

export type PageStackItem = {
    key: string;
    component: Component;
    props?: Record<string, unknown>;
    meta?: {
        kind?: string;
        routeId?: string;
    };
};

export function buildRouteTopPage(routeIndex: number): PageStackItem {
    const route = routes[routeIndex];
    return {
        key: `${route.id}-top`,
        component: markRaw(route.top),
        meta: {
            kind: 'route-top',
            routeId: route.id,
        },
    };
}

export function buildRouteSubPage(routeIndex: number): PageStackItem {
    const route = routes[routeIndex];
    return {
        key: `${route.id}-sub`,
        component: markRaw(route.sub),
        meta: {
            kind: 'route-sub',
            routeId: route.id,
        },
    };
}

export const usePageController = defineStore('pageController', () => {
    const pufferStore = usePufferStore();
    const pageStack = ref<PageStackItem[]>([
        buildRouteTopPage(selectedRoute.value),
    ]);

    // 当前一次页面切换动作，Mountain 会据此选择动画名称
    const transitionAction = ref<StackTransitionAction>('none');

    const topPageCached = computed<PageStackItem | null>(() => {
        return pageStack.value.at(-1) ?? null;
    });

    const secondPageCached = computed<PageStackItem | null>(() => {
        return pageStack.value.length >= 2 ? pageStack.value.at(-2) ?? null : null;
    });

    const stackDepth = computed(() => {
        return pageStack.value.length;
    });

    const isExpanded = computed(() => {
        return pufferStore.morph === 'expanded';
    });

    const hasSecondPage = computed(() => {
        return secondPageCached.value !== null;
    });

    // 手机布局：深度大于 1 时仅显示栈顶页面
    const isMobileForegroundMode = computed(() => {
        return !isExpanded.value && stackDepth.value > 1;
    });

    // 背景层（左栏）显示的页面
    const backgroundPageCached = computed<PageStackItem | null>(() => {
        if (isExpanded.value) {
            return secondPageCached.value ?? topPageCached.value;
        }
        return topPageCached.value;
    });

    // 前景层（右栏）显示的页面
    const foregroundPageCached = computed<PageStackItem | null>(() => {
        if (isExpanded.value) {
            return hasSecondPage.value ? topPageCached.value : null;
        }
        return isMobileForegroundMode.value ? topPageCached.value : null;
    });

    function normalizePage(item: PageStackItem): PageStackItem {
        return {
            ...item,
            component: markRaw(item.component),
        };
    }

    // 推页面到栈顶
    function pushPage(item: PageStackItem) {
        pageStack.value.push(normalizePage(item));
        transitionAction.value = 'push';
    }

    // 删除栈顶页面
    function popPage() {
        if (pageStack.value.length <= 1) {
            return;
        }
        pageStack.value.pop();
        transitionAction.value = 'pop';
    }

    // 清空只保留栈底一个页面
    function clearToBottomPage() {
        if (pageStack.value.length <= 1) {
            return;
        }
        pageStack.value = [pageStack.value[0]];
        transitionAction.value = 'none';
    }

    // 获取栈顶第一个页面(有缓存)
    function getTopPageCached() {
        return topPageCached.value;
    }

    // 获取栈顶第二个页面(有缓存)
    function getSecondPageCached() {
        return secondPageCached.value;
    }

    // Mountain 在动画结束后调用，避免后续渲染误触发切换动画
    function clearTransitionAction() {
        transitionAction.value = 'none';
    }

    // 切换当前主路由，并重置页面栈
    function switchRoute(routeIndex: number) {
        selectedRoute.value = routeIndex;
        pageStack.value = [buildRouteTopPage(routeIndex)];
        transitionAction.value = 'none';
    }

    return {
        pageStack,
        stackDepth,
        transitionAction,
        isExpanded,
        hasSecondPage,
        isMobileForegroundMode,
        backgroundPageCached,
        foregroundPageCached,
        pushPage,
        popPage,
        clearToBottomPage,
        getTopPageCached,
        getSecondPageCached,
        clearTransitionAction,
        switchRoute,
        buildRouteTopPage,
        buildRouteSubPage
    }
});