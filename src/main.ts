import { createApp } from "vue";
import { createPinia } from "pinia";

import Main from "./Main.vue";

const app = createApp(Main);

app.use(createPinia());
app.mount(document.body);