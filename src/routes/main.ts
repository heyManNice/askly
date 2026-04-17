import {
    FiMessageSquare,
    FiServer,
    FiUsers,
    FiShoppingBag,
    FiDatabase
} from 'vue-icons-plus/fi';

import {
    ref
} from 'vue';

import ConversationsList from '@pages/conversations/List.vue';
import RolesList from '@pages/roles/List.vue';
import ApisList from '@pages/apis/List.vue';
import DatabaseList from '@pages/database/List.vue';
import ResourcesList from '@pages/resources/List.vue';

import {
    usePageController
} from '@pages/controller';


type Route = {
    id: string;
    label: string;
    icon: typeof FiMessageSquare;
    onClick: () => void;
    onClickInMorePage?: () => void;
};

export const routes: Route[] = [
    {
        id: 'conversations',
        label: '会话',
        icon: FiMessageSquare,
        onClick: () => {
            const pageController = usePageController();
            pageController.replace(ConversationsList);
        }
    },
    {
        id: 'roles',
        label: '角色',
        icon: FiUsers,
        onClick: () => {
            const pageController = usePageController();
            pageController.replace(RolesList);
        }
    },
    {
        id: 'apis',
        label: '接口',
        icon: FiServer,
        onClick: () => {
            const pageController = usePageController();
            pageController.replace(ApisList);
        },
        onClickInMorePage: () => {
            const pageController = usePageController();
            pageController.push(ApisList);
        }
    },
    {
        id: 'database',
        label: '数据库',
        icon: FiDatabase,
        onClick: () => {
            const pageController = usePageController();
            pageController.replace(DatabaseList);
        },
        onClickInMorePage: () => {
            const pageController = usePageController();
            pageController.push(DatabaseList);
        }
    },
    {
        id: 'resources',
        label: '资源',
        icon: FiShoppingBag,
        onClick: () => {
            const pageController = usePageController();
            pageController.replace(ResourcesList);
        },
        onClickInMorePage: () => {
            const pageController = usePageController();
            pageController.push(ResourcesList);
        }
    }
];
// 选中的路由
export const selectedRoute = ref<number>(0);