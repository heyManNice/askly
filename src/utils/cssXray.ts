type DebugInspectorOptions = {
    shortcut?: string;
    debugClassName?: string;
};

const DEFAULT_SHORTCUT = "d";
const DEFAULT_DEBUG_CLASS = "debug";

function getStyleElementId(debugClassName: string): string {
    const safeClassName = debugClassName.replace(/[^a-zA-Z0-9_-]/g, "_");
    return `debug-inspector-style-${safeClassName}`;
}

function ensureDebugStyles(debugClassName: string): void {
    const styleElementId = getStyleElementId(debugClassName);
    if (document.getElementById(styleElementId)) {
        return;
    }

    const styleElement = document.createElement("style");
    styleElement.id = styleElementId;
    styleElement.textContent = `
/* debug时显示元素边框和对角线 */
.${debugClassName} * {
    outline: 1px solid blue;
    background-image: linear-gradient(to bottom right,
            transparent calc(50%),
            red calc(50% - 1px),
            red calc(50% + 1px),
            transparent calc(50%));
    background-repeat: no-repeat;
    background-size: 100% 100%;
}

.${debugClassName} *:hover {
    background-color: rgba(0, 0, 255, 0.1) !important;
}

.${debugClassName} [data-debug-hover]::after {
    content: attr(class);
    position: fixed;
    top: 0;
    right: 0;
    font-size: 10px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 2px;
}

.${debugClassName} [data-debug-hover]:not([class])::after {
    content: "(empty)";
}
`;

    document.head.appendChild(styleElement);
}

function normalizeShortcut(shortcut: string): string[] {
    return shortcut
        .toLowerCase()
        .split("+")
        .map((token) => token.trim())
        .filter(Boolean);
}

function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
    const tokens = normalizeShortcut(shortcut);
    const keyToken = tokens.find((token) => !["ctrl", "shift", "alt", "meta"].includes(token));

    if (!keyToken || event.key.toLowerCase() !== keyToken) {
        return false;
    }

    const expectCtrl = tokens.includes("ctrl");
    const expectShift = tokens.includes("shift");
    const expectAlt = tokens.includes("alt");
    const expectMeta = tokens.includes("meta");

    return event.ctrlKey === expectCtrl
        && event.shiftKey === expectShift
        && event.altKey === expectAlt
        && event.metaKey === expectMeta;
}

export function cssXraySetup(options: DebugInspectorOptions = {}): void {
    const shortcut = options.shortcut ?? DEFAULT_SHORTCUT;
    const debugClassName = options.debugClassName ?? DEFAULT_DEBUG_CLASS;

    ensureDebugStyles(debugClassName);

    const onMouseover = (event: Event): void => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        target.setAttribute("data-debug-hover", "true");
    };

    const onMouseout = (event: Event): void => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        target.removeAttribute("data-debug-hover");
    };

    document.addEventListener("keydown", (event) => {
        if (!matchesShortcut(event, shortcut)) {
            return;
        }

        document.body.classList.toggle(debugClassName);

        if (document.body.classList.contains(debugClassName)) {
            document.body.addEventListener("mouseover", onMouseover);
            document.body.addEventListener("mouseout", onMouseout);
            return;
        }

        document.body.removeEventListener("mouseover", onMouseover);
        document.body.removeEventListener("mouseout", onMouseout);
    });
}