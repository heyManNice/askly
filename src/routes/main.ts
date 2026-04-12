import {
    FiMessageSquare,
    FiServer,
    FiUsers,
    FiShoppingBag,
    FiDatabase,
} from 'vue-icons-plus/fi';


type Route = {
    id: string;
    label: string;
    icon: typeof FiMessageSquare;
};

export const routes: Route[] = [
    {
        id: 'conversations',
        label: '会话',
        icon: FiMessageSquare
    },
    {
        id: 'roles',
        label: '角色',
        icon: FiUsers
    },
    {
        id: 'apis',
        label: '接口',
        icon: FiServer
    },
    {
        id: 'database',
        label: '数据库',
        icon: FiDatabase
    },
    {
        id: 'resources',
        label: '资源',
        icon: FiShoppingBag
    }
];