import type { Directive } from "vue";
import morphdom from "morphdom";

type DiffHtmlElement = HTMLElement & {
    __diffHtml?: string;
};

type SelectionOffsets = {
    start: number;
    end: number;
};

function getPointOffset(root: HTMLElement, node: Node, offset: number) {
    const range = document.createRange();
    range.selectNodeContents(root);
    range.setEnd(node, offset);
    return range.toString().length;
}

function captureSelectionOffsets(root: HTMLElement): SelectionOffsets | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return null;
    }

    const range = selection.getRangeAt(0);
    const startInRoot = root.contains(range.startContainer);
    const endInRoot = root.contains(range.endContainer);
    if (!startInRoot || !endInRoot) {
        return null;
    }

    return {
        start: getPointOffset(root, range.startContainer, range.startOffset),
        end: getPointOffset(root, range.endContainer, range.endOffset),
    };
}

function resolvePointByOffset(root: HTMLElement, offset: number) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    let accumulated = 0;
    let lastText: Text | null = null;

    while (current) {
        const textNode = current as Text;
        const len = textNode.data.length;
        if (offset <= accumulated + len) {
            return {
                node: textNode,
                offset: Math.max(0, offset - accumulated),
            };
        }
        accumulated += len;
        lastText = textNode;
        current = walker.nextNode();
    }

    if (lastText) {
        return {
            node: lastText,
            offset: lastText.data.length,
        };
    }

    return {
        node: root,
        offset: root.childNodes.length,
    };
}

function restoreSelectionOffsets(root: HTMLElement, offsets: SelectionOffsets | null) {
    if (!offsets) {
        return;
    }

    const selection = window.getSelection();
    if (!selection) {
        return;
    }

    const start = resolvePointByOffset(root, offsets.start);
    const end = resolvePointByOffset(root, offsets.end);
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);

    selection.removeAllRanges();
    selection.addRange(range);
}

function patchHtml(el: DiffHtmlElement, nextHtml: string) {
    const currentHtml = el.__diffHtml ?? "";
    if (currentHtml === nextHtml) {
        return;
    }

    const offsets = captureSelectionOffsets(el);
    const nextTree = document.createElement(el.tagName);
    nextTree.innerHTML = nextHtml;

    morphdom(el, nextTree, {
        childrenOnly: true,
    });

    restoreSelectionOffsets(el, offsets);
    el.__diffHtml = nextHtml;
}

const diffHtmlDirective: Directive<DiffHtmlElement, string> = {
    mounted(el, binding) {
        const html = binding.value ?? "";
        el.innerHTML = html;
        el.__diffHtml = html;
    },
    updated(el, binding) {
        patchHtml(el, binding.value ?? "");
    },
    beforeUnmount(el) {
        delete el.__diffHtml;
    },
};

export default diffHtmlDirective;