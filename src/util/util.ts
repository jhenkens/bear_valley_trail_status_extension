function parseBoolExact(value: string): boolean {
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true') {
        return true;
    }
    if (lowerValue === 'false') {
        return false;
    }
    throw new Error(`Invalid boolean value: ${value}`);
}

function compareStrings(
    a: string | undefined | null,
    b: string | undefined | null
): number {
    a = a ?? null;
    b = b ?? null;
    if (a === null && b !== null) {
        return -1;
    }
    if (a !== null && b === null) {
        return 1;
    }
    if (a === null && b === null) {
        return 0;
    }
    return a!.localeCompare(b!);
}

const debounce = (func: Function, timeout = 100) => {
    let timer: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(window, args);
        }, timeout);
    };
};

function trNodeMutationFilter(mutation: MutationRecord): boolean {
    if (mutation.type !== 'childList') {
        return false;
    }
    if (mutation.addedNodes.length === 0) {
        return false;
    }
    if (mutation.target.nodeName !== 'TBODY') {
        return false;
    }
    const addedNode = mutation.addedNodes[0];
    if (addedNode.nodeName !== 'TR') {
        return false;
    }
    return true;
}

var a = trNodeMutationFilter;

function buildDomObserver(
    func: Function,
    filter: (mutation: MutationRecord) => boolean = () => true
) {
    let observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation: MutationRecord) => {
            if (!filter(mutation)) {
                return;
            }
            func();
        });
    });
    observer.observe(document.body, {
        characterDataOldValue: true,
        subtree: true,
        childList: true,
        characterData: true,
    });
}

function createElement(input: string) {
    const container = document.createElement('div');
    container.innerHTML = input;
    return container.firstElementChild!;
}

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export {
    parseBoolExact,
    compareStrings,
    debounce,
    trNodeMutationFilter,
    buildDomObserver,
    capitalize,
    createElement,
};
