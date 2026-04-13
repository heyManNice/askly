import {
    defineStore
} from "pinia";
import {
    ref
} from "vue";


export const usePinStore = defineStore('pin', () => {
    const isPinned = ref(false);

    function togglePin() {
        isPinned.value = !isPinned.value;
    }
    return {
        isPinned,
        togglePin,
    };
});