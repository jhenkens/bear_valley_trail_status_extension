import { getTrailsFromDom, getTrailsListTable } from './util/loaders';
import { buildDomObserver, debounce, trNodeMutationFilter } from './util/util';

// Event listener
function handleMessages(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
) {
    if (message.type === 'getTrailData') {
        sendTrailDataDebounced();
        return false;
    }
    return false;
}

chrome.runtime.onMessage.addListener(handleMessages);

function sendTrailData() {
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

    chrome.runtime.sendMessage({
        type: 'trailData',
        sections: [...sections],
        states,
        trails: trails.map((trail) => trail.toJsonObject()),
    });
}

const sendTrailDataDebounced = debounce(sendTrailData);
buildDomObserver(sendTrailDataDebounced, trNodeMutationFilter);
export {};
