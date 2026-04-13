import Dexie, { Table } from 'dexie';

class Database extends Dexie {
    // 接口数据库
    apis!: Table<{
        // 自增id
        id?: number;
        // 名字
        name: string;
        // 地址
        url: string;
        // 创建时间
        createdAt: Date;
        // 更新时间
        updatedAt: Date;
    }, number>;

    // 角色数据库
    roles!: Table<{
        // 自增id
        id?: number;
        // 名字
        name: string;
        // 头像
        avatar: Blob;
        // 描述，相当于备注没什么用
        description: string;
        // 提示词
        prompts: string;
        // 随机度
        temperature: number;
        // 上下文限制条数
        contextLimit: number;
        // 单词信息输出长度
        outputLimit: number;
        // 创建时间
        createdAt: Date;
        // 更新时间
        updatedAt: Date;
    }, number>;

    constructor() {
        super('askly-database');
        this.version(1).stores({
            apis: '++id',
            roles: '++id',
        });
    }
}

export const db = new Database();
export const apis = db.apis;
export const roles = db.roles;