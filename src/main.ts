import { createApp } from "vue";
import { createPinia } from "pinia";
import { cssXraySetup } from "@utils/cssXray";
import "@src/main.css";

import Main from "@src/Main.vue";
import diffHtmlDirective from "@directives/diffHtml";

const app = createApp(Main);
app.use(createPinia());
app.directive("diff-html", diffHtmlDirective);
app.mount(document.body);

// 启用这个能使用树摇优化
if (import.meta.env.DEV) {
    cssXraySetup({
        shortcut: "shift+d"
    });
}