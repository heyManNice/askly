import { z, type ZodTypeAny } from "zod";

export type AiFunctionInfo = {
    name: string;
    describe: string;
};

export type AiFunction = {
    name: string;
    describe: string;
    params: ZodTypeAny;
    return: ZodTypeAny;
    call: (args?: unknown) => unknown | Promise<unknown>;
    info: () => string;
};

function isAiFunction(value: unknown): value is AiFunction {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const fn = value as Partial<AiFunction>;
    return (
        typeof fn.name === "string" &&
        typeof fn.describe === "string" &&
        fn.params instanceof z.ZodType &&
        fn.return instanceof z.ZodType &&
        typeof fn.call === "function" &&
        typeof fn.info === "function"
    );
}

const modules = import.meta.glob("./*.ts", {
    eager: true,
    import: "default",
}) as Record<string, unknown>;

const aiFunctions = Object.values(modules).filter(isAiFunction);

export function getAiFunctions() {
    return aiFunctions;
}

export function getAiFunctionInfos() {
    return aiFunctions.map((fn) => {
        try {
            return fn.info();
        } catch {
            return JSON.stringify({
                name: fn.name,
                describe: fn.describe,
            });
        }
    });
}
