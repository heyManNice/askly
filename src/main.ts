import { createApp } from "vue";
import { createPinia } from "pinia";

import Main from "./Main.vue";
import diffHtmlDirective from "./directives/diffHtml";
import "./tailwind.css";

const app = createApp(Main);

app.use(createPinia());
app.directive("diff-html", diffHtmlDirective);
app.mount(document.body);