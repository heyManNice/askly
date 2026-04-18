import { createApp } from "vue";
import { createPinia } from "pinia";
import { cssXraySetup } from "@utils/cssXray";

import "@src/main.css";

import Main from "@src/Main.vue";
import diffHtmlDirective from "@directives/diffHtml";
import tray from "@eziapp-org/bridge/tray";
import windowm from "@eziapp-org/bridge/windowm";
import shortcut from "@eziapp-org/bridge/shortcut";

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

windowm.getCurrentWindow().then(win => {
    // 显示托盘图标
    tray.show(win);

    // 注册全局快捷键
    shortcut.register({
        alt: true,
        key: "C",
    }, async() => {
        if(await win.isFocused()) {
            await win.hide();
        }else{
            await win.show();
            await win.focus();
        }
    });
})