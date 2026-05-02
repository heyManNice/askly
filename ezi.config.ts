import { defineConfig } from "@eziapp-org/bridge";

export default defineConfig({
    application: {
        name: "问答",
        package: "com.ezi.demo.askly",
        icon: "image/logo.png",
        singleInstance: true,
    },
    window: {
        title: "问答",
        size: {
            width: 1200,
            height: 800,
        },
        minSize: {
            width: 300,
            height: 400,
        },
        splashscreen: {
            src: "image/logo.png",
        },
    },
});
