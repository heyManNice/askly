import { createApp } from "vue";
import { createPinia } from "pinia";
import { cssXraySetup } from "@utils/cssXray";

import Main from "@src/Main.vue";
import diffHtmlDirective from "@directives/diffHtml";
import version from "@eziapp-org/bridge/version"
import "@src/main.css";

const app = createApp(Main);

app.use(createPinia());
app.directive("diff-html", diffHtmlDirective);

app.mount(document.body);

if (version.isDebug()) {
    cssXraySetup({
        shortcut: "shift+d"
    });
}