import { defineConfig } from "@eziapp-org/bridge";

export default defineConfig({
    application: {
        name: "问答",
        package: "com.ezi.demo.chat",
        icon: "image/logo.png",
    },
    window: {
        title: "问答",
        backgroundMode: "mica",
        size: {
            width: 1200,
            height: 800,
        },
        splashscreen: {
            src: "image/logo.png",
        },
    },
});
