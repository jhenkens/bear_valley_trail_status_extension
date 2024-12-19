import { Change } from './util/change';
import { getTrailsFromDom, getTrailsListTable } from './util/loaders';
import {
    buildDomObserver,
    debounce,
    sleep,
    trNodeMutationFilter,
} from './util/util';

// Event listener
function handleMessages(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
) {
    if (message === null || message === undefined || !('type' in message)) {
        return false;
    }
    if (message.type === 'getTrailData') {
        setInterval(() => {
            sendResponse(getTrailData());
        }, 50);

        return true;
    }
    if (message.type === 'applyChange') {
        applyChange(Change.fromJsonObject(message.change)).then(() => {
            sendResponse({ success: true });
        });
        return true;
    }
    return false;
}

chrome.runtime.onMessage.addListener(handleMessages);

function getTrailData() {
    const trails = getTrailsFromDom(getTrailsListTable()!);
    if (trails.length === 0) {
        return;
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
    const sections = new Set();
    trails.forEach((trail) => {
        if (trail.section !== null) {
            sections.add(trail.section);
        }
    });

    return {
        type: 'trailData',
        sections: [...sections],
        states,
        trails: trails.map((trail) => trail.toJsonObject()),
    };
}

async function applyChange(change: Change) {
    const table = getTrailsListTable()!;
    var changeRowSection: HTMLTableCellElement | null = null;
    var count = 10;
    while (changeRowSection === null && --count > 0) {
        changeRowSection = table.querySelector(
            `#${change.trail.idForSection()}`
        )!;
        if(changeRowSection === null){
            await sleep(1000);
        }
    }
    if(changeRowSection === null){
        console.error('Could not find change row', change);
        return;
    }
    const changeRow = changeRowSection.closest('tr')!;
    changeRow.scrollIntoView();
    const statusOverride = changeRow.querySelector('td.col-status-override')!;
    const statusOverrideDropdown = statusOverride.querySelector(
        'div.dropdown-toggle'
    )!;
    const statusOverrideSelectedbox: HTMLDivElement = <HTMLDivElement>(
        statusOverrideDropdown.querySelector('div.select-box')!
    );
    statusOverrideSelectedbox.click();

    const statusOverrideDropdownUl = statusOverride.querySelector('ul')!;
    const statusOverrideSpan = [
        ...statusOverrideDropdownUl.querySelectorAll('span')!,
    ].filter(
        (a) =>
            a.textContent!.trim().toLowerCase() ===
            change.changeSet.operationalStatus
    )[0];
    const statusOverrideLi = statusOverrideSpan.closest('li')!;
    const statusOverrideLink = statusOverrideLi.querySelector('a')!;

    await sleep(500);
    statusOverrideLi.scrollIntoView();
    statusOverrideLink.click();
}

const sendTrailDataDebounced = debounce(() => {
    chrome.runtime.sendMessage(getTrailData());
});
buildDomObserver(sendTrailDataDebounced, trNodeMutationFilter);
