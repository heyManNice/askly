<script lang="ts" setup>
import { ref, watch } from "vue";

type TextInputProps = {
    modelValue: string;
    label: string;
    type?: string;
    placeholder?: string;
    defaultValue?: string;
};

const props = withDefaults(defineProps<TextInputProps>(), {
    type: "text",
    placeholder: "",
    defaultValue: "",
});

const emit = defineEmits<{
    "update:modelValue": [value: string];
}>();

function normalizeValue(value: string): string {
    const trimmed = value.trim();
    return trimmed === "" ? props.defaultValue : trimmed;
}

const innerValue = ref(props.modelValue === props.defaultValue ? "" : props.modelValue);

watch(
    () => props.modelValue,
    (value) => {
        innerValue.value = value === props.defaultValue ? "" : value;
    },
    { immediate: true },
);

watch(innerValue, (value) => {
    const nextValue = normalizeValue(value);
    if (nextValue !== props.modelValue) {
        emit("update:modelValue", nextValue);
    }
}, { immediate: true });
</script>

<template>
    <label class="grid gap-1">
        <span class="text-sm text-gray-500 dark:text-zinc-400">{{ label }}</span>
        <input v-model="innerValue" :type="type" :placeholder="placeholder || defaultValue"
            class="h-9 px-2 rounded bg-gray-100 dark:bg-zinc-800 dark:border dark:border-zinc-900" />
    </label>
</template>