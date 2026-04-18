import { z } from "zod";

export default {
    name: "times",
    describe: "获取本地时间",
    params: z.object({}),
    return: z.string().describe("本地时间字符串"),
    call: function (): z.infer<typeof this.return> {
        return new Date().toLocaleString();
    },
    info() {
        return JSON.stringify({
            name: this.name,
            describe: this.describe,
            params: "{}",
            return: "string",
        });
    }
};