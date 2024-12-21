import { Change } from './util/change';
import { AUTOMATIC_STATUS } from './util/constants';
import { getTrailsFromDom, getTrailsListTable } from './util/loaders';
import {
    handleTrailDataMessage,
    isValidMessage,
    type ApplyChangeMessage,
    type MessageHandler,
    type TrailDataMessage,
} from './util/message_handler';
import { getTrailFromState } from './util/state';
import {
    buildDomObserver,
    debounce,
    sleep,
    trNodeMutationFilter,
} from './util/util';

const handleMessages: MessageHandler = function (
    message,
    sender,
    sendResponse
) {
    if (!isValidMessage(message)) {
        return false;
    }

    if (message.type === 'getTrailData') {
        if (sendResponse !== null) {
            setTimeout(() => {
                sendResponse(getTrailData());
            }, 50);
            return true;
        }
        return false;
    }
    if (message.type === 'applyChange') {
        const applyChangeMessage = message as ApplyChangeMessage;
        const change = Change.fromJsonObject(applyChangeMessage.change);
        applyChange(change).then((changeResult) => {
            if (sendResponse !== null) {
                sendResponse({ success: true });
            }
        });
        return true;
    }
    return false;
};

chrome.runtime.onMessage.addListener(handleMessages);

function getTrailData(): TrailDataMessage {
    const trails = getTrailsFromDom(getTrailsListTable()!);
    if (trails.length === 0) {
        return {
            type: 'trailData',
            sections: [],
            states: [],
            trails: [],
        };
    }
    const firstRow = trails[0].domRow!;
    const stateDoc = firstRow.querySelector('td.col-status-override')!;
    const selectedState =
        stateDoc.querySelector('div.selection-text')!.textContent!;
    const otherStates = [...stateDoc.querySelectorAll('li span')].map(
        (a) => a!.textContent
    );
    const allStates = new Set([selectedState, ...otherStates]);
    const states = [...allStates]
        .map((a) => a!.trim().toLowerCase())
        .filter((a) => a !== '' && a !== '-')
        .sort();
    const sections: Set<string> = new Set();
    trails.forEach((trail) => {
        if (trail.section !== null) {
            sections.add(trail.section);
        }
    });

    const trailData: TrailDataMessage = {
        type: 'trailData',
        sections: [...sections],
        states,
        trails: trails.map((trail) => trail.toJsonObject()),
    };
    handleTrailDataMessage(trailData);
    return trailData;
}

async function applyChange(change: Change) {
    try {
        pauseSendTrailData = true;
        const table = getTrailsListTable()!;
        var changeRowSection: HTMLTableCellElement | null = null;
        var count = 10;
        if (!change.hasChanges()) {
            return;
        }

        while (changeRowSection === null && --count > 0) {
            changeRowSection = table.querySelector(
                `#${change.trail.idForSection()}`
            )!;
            if (changeRowSection === null) {
                await sleep(1000);
            }
        }
        if (changeRowSection === null) {
            console.error('Could not find change row', change);
            return;
        }
        const changeRow = changeRowSection.closest('tr')!;
        changeRow.scrollIntoView();
        if (change.changeSet.statusOverride === AUTOMATIC_STATUS) {
            const automaticStatus = changeRow.querySelector(
                'td.col-automatic-status'
            )!;
            const automaticStatusButton: HTMLDivElement =
                automaticStatus.querySelector('div.cr-toggle-display')!;
            automaticStatusButton.scrollIntoView();
            await sleep(100);
            automaticStatusButton.click();
        } else {
            const statusOverride = changeRow.querySelector(
                'td.col-status-override'
            )!;
            const statusOverrideDropdown = statusOverride.querySelector(
                'div.dropdown-toggle'
            )!;
            const statusOverrideSelectedbox: HTMLDivElement = <HTMLDivElement>(
                statusOverrideDropdown.querySelector('div.select-box')!
            );
            statusOverrideSelectedbox.click();

            const statusOverrideDropdownUl =
                statusOverride.querySelector('ul')!;
            const statusOverrideSpan = [
                ...statusOverrideDropdownUl.querySelectorAll('span')!,
            ].filter(
                (a) =>
                    a.textContent!.trim().toLowerCase() ===
                    change.changeSet.statusOverride
            )[0];
            const statusOverrideLi = statusOverrideSpan.closest('li')!;
            const statusOverrideLink = statusOverrideLi.querySelector('a')!;

            await sleep(100);
            statusOverrideLi.scrollIntoView();
            statusOverrideLink.click();
        }
        await sleep(1000);
        for (let i = 0; i < 10; i++) {
            getTrailData();
            const trail = getTrailFromState(change.trail.id);
            if (trail !== null) {
                change.trail = trail;
            }
            if (change.hasChanges()) {
                await sleep(1000);
            } else {
                return { success: true };
            }
        }
        return { success: false };
    } finally {
        pauseSendTrailData = false;
    }
}
var pauseSendTrailData = false;

const sendTrailDataDebounced = debounce(() => {
    if (!pauseSendTrailData) {
        chrome.runtime.sendMessage(getTrailData());
    }
});
buildDomObserver(sendTrailDataDebounced, trNodeMutationFilter);
