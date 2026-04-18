import {
    defineStore
} from "pinia";
import {
    ref
} from "vue";

import windowm from '@eziapp-org/bridge/windowm';


export const usePinStore = defineStore('pin', () => {
    const isPinned = ref(false);
    let window: Awaited<ReturnType<typeof windowm.getCurrentWindow>> | null = null;
    windowm.getCurrentWindow().then(w => {
        window = w;
    });

    function togglePin() {
        isPinned.value = !isPinned.value;
        if (window) {
            window.setAlwaysOnTop(isPinned.value)
        }
    }
    return {
        isPinned,
        togglePin,
    };
});