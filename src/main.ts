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
app.mount("#app");

// 启用这个能使用树摇优化
if (import.meta.env.DEV) {
    cssXraySetup({
        shortcut: "shift+d"
    });
}

windowm.getCurrentWindow().then(win => {
    // 显示托盘图标
    tray.show();

    // 注册全局快捷键
    shortcut.register({
        alt: true,
        key: "f",
    }, async () => {
        if (await win.isFocused()) {
            await win.hide();
        } else {
            await win.show();
            await win.focus();
        }
    }).catch((err) => {
        if (import.meta.env.DEV) {
            console.error("注册快捷键失败", err);
        } else {
            alert("注册快捷键失败" + err);
        }
    });

    // 一个从linux获得灵感的功能：
    // 按住ctrl键时，鼠标变成移动图标，可以拖动窗口；按住ctrl键+右键时，可以调整窗口大小
    document.addEventListener("keydown", function (event) {
        if (event.ctrlKey) {
            document.body.classList.add("ctrl-press-cursor");
        }
    });

    document.addEventListener("keyup", function (event) {
        if (!event.ctrlKey) {
            document.body.classList.remove("ctrl-press-cursor");
        }
    });

    // 鼠标右键按下时记录位置
    const mousePos = { x: 0, y: 0 };
    // 鼠标按下时的窗口大小
    const windowSize = { width: 0, height: 0 };

    document.addEventListener("mousedown", function (event) {
        if (event.ctrlKey && event.button === 0) {
            win.drag();
        }
        // 如果是右键+ctrl键，启用调整窗口大小
        else if (event.ctrlKey && event.button === 2) {
            win.getSize().then(size => {
                windowSize.width = size.width;
                windowSize.height = size.height;

                mousePos.x = event.clientX;
                mousePos.y = event.clientY;

                // 鼠标移动时调整窗口大小
                function onMouseMove(event: MouseEvent) {
                    const deltaX = event.clientX - mousePos.x;
                    const deltaY = event.clientY - mousePos.y;
                    win.setSize({
                        width: windowSize.width + deltaX,
                        height: windowSize.height + deltaY
                    });
                }
                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", function onMouseUp() {
                    document.removeEventListener("mousemove", onMouseMove);
                }, { once: true });
            });
        }
    });
})