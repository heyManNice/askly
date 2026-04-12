import {
    FiMessageSquare,
    FiServer,
    FiUsers,
    FiShoppingBag,
    FiDatabase,
} from 'vue-icons-plus/fi';

import {
    ref,
    Component
} from 'vue';


// 会话
import ConversationsTop from '@pages/conversations/Top.vue';
import ConversationsSub from '@pages/conversations/Sub.vue';

// 角色
import RolesTop from '@pages/roles/Top.vue';
import RolesSub from '@pages/roles/Sub.vue';

type Route = {
    id: string;
    label: string;
    icon: typeof FiMessageSquare;
    top: Component;
    sub: Component;
};

export const routes: Route[] = [
    {
        id: 'conversations',
        label: '会话',
        icon: FiMessageSquare,
        top: ConversationsTop,
        sub: ConversationsSub
    },
    {
        id: 'roles',
        label: '角色',
        icon: FiUsers,
        top: RolesTop,
        sub: RolesSub
    },
    {
        id: 'apis',
        label: '接口',
        icon: FiServer,
        top: RolesTop,
        sub: RolesSub
    },
    {
        id: 'database',
        label: '数据库',
        icon: FiDatabase,
        top: RolesTop,
        sub: RolesSub
    },
    {
        id: 'resources',
        label: '资源',
        icon: FiShoppingBag,
        top: RolesTop,
        sub: RolesSub
    }
];

// 选中的路由
export const selectedRoute = ref<number>(0);