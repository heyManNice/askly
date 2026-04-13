import {
    FiMessageSquare,
    FiServer,
    FiUsers,
    FiShoppingBag,
    FiDatabase,
    FiMenu
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

// 接口
import ApisTop from '@pages/apis/Top.vue';
import ApisSub from '@pages/apis/Sub.vue';

// 数据库
import DatabaseTop from '@pages/database/Top.vue';
import DatabaseSub from '@pages/database/Sub.vue';

// 资源
import ResourcesTop from '@pages/resources/Top.vue';
import ResourcesSub from '@pages/resources/Sub.vue';

// 更多
import MoreTop from '@pages/more/Top.vue';
import MoreSub from '@pages/more/Sub.vue';

type Route = {
    id: string;
    label: string;
    icon: typeof FiMessageSquare;
    top: Component;
    sub: Component;
    hiddenOnDesktop?: boolean;
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
        top: ApisTop,
        sub: ApisSub
    },
    {
        id: 'database',
        label: '数据库',
        icon: FiDatabase,
        top: DatabaseTop,
        sub: DatabaseSub
    },
    {
        id: 'resources',
        label: '资源',
        icon: FiShoppingBag,
        top: ResourcesTop,
        sub: ResourcesSub
    },
    {
        id: 'more',
        label: '更多',
        icon: FiMenu,
        top: MoreTop,
        sub: MoreSub,
        hiddenOnDesktop: true
    }
];

export const moreRouteIndex = routes.findIndex(route => route.id === 'more');

// 选中的路由
export const selectedRoute = ref<number>(0);