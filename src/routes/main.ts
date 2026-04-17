import {
    FiMessageSquare,
    FiServer,
    FiUsers,
    FiShoppingBag,
    FiDatabase
} from 'vue-icons-plus/fi';

import {
    type Component,
    ref
} from 'vue';

import ConversationsList from '@pages/conversations/List.vue';
import RolesList from '@pages/roles/List.vue';
import ApisList from '@pages/apis/List.vue';
import DatabaseList from '@pages/database/List.vue';
import ResourcesList from '@pages/resources/List.vue';

import {
    usePageStackStore
} from '@stores/pageStack';


type Route = {
    id: string;
    label: string;
    icon: typeof FiMessageSquare;
    page: Component;
};

export const routes: Route[] = [
    {
        id: 'conversations',
        label: '会话',
        icon: FiMessageSquare,
        page: ConversationsList,
    },
    {
        id: 'roles',
        label: '角色',
        icon: FiUsers,
        page: RolesList,
    },
    {
        id: 'apis',
        label: '接口',
        icon: FiServer,
        page: ApisList,
    },
    {
        id: 'database',
        label: '数据库',
        icon: FiDatabase,
        page: DatabaseList,
    },
    {
        id: 'resources',
        label: '资源',
        icon: FiShoppingBag,
        page: ResourcesList,
    }
];

// 选中的路由
export const activeRouteIndex = ref<number>(0);

type RouteOpenMode = 'replace' | 'push';

export function openRoute(index: number, mode: RouteOpenMode = 'replace') {
    const route = routes[index];
    if (!route) {
        return;
    }

    const pageStack = usePageStackStore();
    activeRouteIndex.value = index;

    if (mode === 'push') {
        pageStack.push(route.page);
        return;
    }

    pageStack.replace(route.page);
}

export function initializeNavigation() {
    const pageStack = usePageStackStore();
    if (pageStack.stack.length === 0) {
        openRoute(activeRouteIndex.value);
    }
}