import { Change } from './util/change';
import { AUTOMATIC_STATUS, getIconForTrailRating } from './util/constants';
import {
    handleTrailDataMessage,
    isValidMessage,
    type ApplyChangeMessage,
    type MessageHandler,
    type TrailDataMessage,
} from './util/message_handler';
import { getTrailFromState, state, type State } from './util/state';
import { Trail } from './util/trail';
import { capitalize, createElement, sleep } from './util/util';
require('./sidepanel.scss');
import 'bootstrap-icons/font/bootstrap-icons.css';

function addSection(section: string) {
    const sectionId =
        'section-changes-' +
        section.toLowerCase().replace(new RegExp('[- ]+', 'g'), '-');
    var sectionStatus = document.querySelector(`#${sectionId}`);
    if (sectionStatus) {
        return;
    }
    const sectionStatusContainer = document.querySelector(
        '#section-changes-container'
    )!;
    sectionStatus = document.createElement('div');
    sectionStatus.classList.add('section-changes', 'card', 'mb-3');
    sectionStatus.id = sectionId;
    sectionStatus.innerHTML = `
        <div class="card-header">${section}:</div>
        <div class="card-body">
            <ul class="list-group mb-3">
            </ul>
            <button id="${sectionId}-add-change" type="button" class="btn btn-success">Add change</button>
        </div>
    `;
    sectionStatusContainer.appendChild(sectionStatus);
    updateNoChanges(sectionId);
    document
        .querySelector(`#${sectionId}-add-change`)!
        .addEventListener('click', () => addChangeToSection(sectionId));

    const children = [...sectionStatusContainer.children];
    for (const child of children.sort((a, b) => a.id.localeCompare(b.id))) {
        sectionStatusContainer.appendChild(child);
    }
}

function updateNoChanges(sectionId: string) {
    const sectionStatus = document.querySelector(`#${sectionId}`)!;
    const ul = sectionStatus.querySelector('ul')!;
    if (ul.children.length === 0) {
        ul.appendChild(
            createElement(
                "<li class='list-group-item disabled'>No changes</li>"
            )
        );
    } else {
        [...ul.children]
            .filter((li) => li.classList.contains('disabled'))
            .forEach((li) => li.remove());
    }
}

function addChangeToSection(sectionId: string) {
    const sectionStatus = document.querySelector(`#${sectionId}`)!;
    const ul = sectionStatus.querySelector('ul')!;
    const options = [AUTOMATIC_STATUS]
        .concat(state.states)
        .map(
            (state) => `<option value="${state}">${capitalize(state)}</option>`
        )
        .join('\n');
    const li = createElement(
        `
        <li class="list-group-item d-flex justify-content-between align-items-center">
        <div>
            <select class="form-select me-2">
                <option value="*">All States</option>
                ${options}
            </select>
            <span>change to</span>
            <select class="form-select me-2">
                ${options}
            </select>
            </div>
        <span><button type="button" class="btn-close bv-remove-change" aria-label="Close"></button></span>
        </li>
        `
    );
    ul.appendChild(li);
    updateNoChanges(sectionId);
    li.querySelector('.btn-close')!.addEventListener('click', (b) => {
        var btn = <Element>b.target!;
        btn.closest('li')!.remove();
        updateNoChanges(sectionId);
    });
}

function previewChanges() {
    calculateChanges();
    displayChanges();
}

function fromMatchesTrail(from: string, trail: Trail) {
    if (from === '*') {
        return true;
    }
    return trail.effectiveStatus === from;
}
function toMatchesTrail(to: string, trail: Trail) {
    return to !== trail.effectiveStatus;
}
function calculateChanges() {
    const sectionStatusContainer = document.querySelector(
        '#section-changes-container'
    );
    const sections = [...sectionStatusContainer!.children];
    const changesBySection: {
        [key: string]: {
            sectionId: string;
            sectionName: string;
            changes: any[];
        };
    } = {};
    sections.forEach((section) => {
        const sectionId = section.id;
        const sectionName = section
            .querySelector('.card-header')!
            .textContent!.slice(0, -1);
        const ul = section.querySelector('ul')!;
        const changes = [...ul.children]
            .filter((li) => !li.classList.contains('disabled'))
            .map((li) => {
                const selects = li.querySelectorAll('select');
                const from = selects[0].value;
                const to = selects[1].value;
                return { from, to };
            });
        if (changes.length !== 0) {
            changesBySection[sectionName] = { sectionId, sectionName, changes };
        }
    });
    const changes: Change[] = [];
    for (const trail of state.trails) {
        if (trail.section === null) {
            continue;
        }
        const currentSectionChanges = changesBySection[trail.section];
        if (
            currentSectionChanges === undefined ||
            currentSectionChanges.changes.length === 0
        ) {
            continue;
        }
        for (const changeCommand of currentSectionChanges.changes) {
            if (
                fromMatchesTrail(changeCommand.from, trail) &&
                toMatchesTrail(changeCommand.to, trail)
            ) {
                changes.push(
                    new Change(trail, { statusOverride: changeCommand.to })
                );
            }
        }
    }
    state.changes = changes;
}
function displayChanges() {
    const listItem = createElement(`
        <div class="list-group mb-3">
        </div>
            `);
    for (const change of state.changes) {
        if (!change.changeSet) {
            continue;
        }
        if (change.changeSet.statusOverride == undefined) {
            continue;
        }

        const listGroupItem = <HTMLAnchorElement>createElement(`
             <a href="#" id="change-${
                 change.trail.id
             }" class="list-group-item list-group-item-action d-flex justify-content-between align-items-start">
                <div class="me-auto">
                    <div class="fw-bold">${
                        change.trail.name
                    } ${getIconForTrailRating(change.trail.rating)}</div>
                    <div>Operation Status:</div>
                    ${capitalize(
                        change.trail.effectiveStatus!
                    )} -> ${capitalize(change.changeSet.statusOverride)}
                </div>
                <div>
                    <input class="me-1" type="checkbox" checked="true" value="true">
                    <div>
                        <div class="d-none bv-applying spinner-border spinner-border-sm" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <i class="d-none bv-done bi bi-check-circle-fill green"></i>
                        <i class="d-none bv-failed bi bi-x-circle-fill red"></i>
                    </div>
                </div>
            </a>
            `);
        listGroupItem.onclick = function () {
            const input = listGroupItem.querySelector('input')!;
            input.checked = !input.checked;
            change.enabled = input.checked;
            const div = listGroupItem.querySelector('div.me-auto')!;
            if (input.checked) {
                div.classList.remove('opacity-25');
            } else {
                div.classList.add('opacity-25');
            }
            return false;
        };
        listItem.appendChild(listGroupItem);
    }
    const previewContainer = document.querySelector(
        '#section-preview-container'
    )!;
    previewContainer.replaceChildren(listItem);
}

function updateProgressBar(current: number, total: number) {
    const progress: HTMLDivElement = document
        .querySelector('#section-preview')!
        .querySelector('div.progress')!;
    const progressBar: HTMLDivElement =
        progress.querySelector('div.progress-bar')!;
    progress.classList.remove('d-none');
    if (total === 0) {
        current = 0;
        total = 1;
    }
    const percentage = Math.round((current / total) * 100);
    const width = `${percentage}%`;
    progressBar.style.width = width;
    progressBar.ariaValueNow = percentage.toString();
    progressBar.ariaValueMax = '100';
    progressBar.ariaValueMin = '0';
}

function updateRunningState(running: boolean) {
    document.querySelector('#section-preview-apply')!.textContent = running
        ? 'Applying changes...'
        : 'Apply changes';
    document
        .querySelector('#section-preview-apply')!
        .classList.toggle('disabled', running);
    document
        .querySelector('#section-changes-preview')!
        .classList.toggle('disabled', running);
    document.querySelectorAll('a.list-group-item-action').forEach((a) => {
        if (a.id.startsWith('change-')) {
            a.classList.toggle('disabled', running);
        }
    });
    const progressBar = document.querySelector(
        '#section-preview div.progress-bar'
    )!;
    progressBar.classList.toggle('progress-bar-animated', running);
    progressBar.classList.toggle('progress-bar-striped', running);
    document
        .querySelector('#section-preview div.bv-done')!
        .classList.toggle('d-none', running);
}

function updateTrailRunningState(
    trail: Element,
    running: boolean | null,
    failed: boolean | null
) {
    running = running ?? false;
    failed = failed ?? false;
    const hideApplying = !running;
    const hideDone = running || failed;
    const hideFailed = running || !failed;
    trail
        .querySelector('.bv-applying')!
        .classList.toggle('d-none', hideApplying);
    trail.querySelector('.bv-done')!.classList.toggle('d-none', hideDone);
    trail.querySelector('.bv-failed')!.classList.toggle('d-none', hideFailed);
}

async function applyChanges() {
    const changes = state.changes.filter((change) => change.enabled);
    const changesCount = changes.length;
    var current = 0;
    updateProgressBar(current, changesCount);
    updateRunningState(true);
    document.querySelector('#section-preview-apply')!.classList.add('disabled');
    document
        .querySelector('#section-changes-preview')!
        .classList.add('disabled');
    document.querySelectorAll('a.list-group-item-action').forEach((a) => {
        if (a.id.startsWith('change-')) {
            a.classList.add('disabled');
        }
    });

    for (const change of changes) {
        const changeRow = document.querySelector(`#change-${change.trail.id}`)!;
        updateTrailRunningState(changeRow, true, null);
        await applyChange(change);
        updateChangeWithState(change);
        updateProgressBar(++current, changesCount);
        updateTrailRunningState(changeRow, false, change.hasChanges());
    }
    document
        .querySelectorAll('button.bv-remove-change')!
        .forEach((btn) => (<HTMLButtonElement>btn).click());
    await sleep(100);
    previewChanges();
    updateRunningState(false);
}

function updateChangeWithState(change: Change) {
    const trail = getTrailFromState(change.trail.id);
    if(trail === null) {
        return;
    }
    change.trail = trail;
}

async function applyChange(change: Change) {
    if (!change.enabled) {
        return;
    }
    const trail = getTrailFromState(change.trail.id);
    change.trail = trail!;
    if (!change.hasChanges()) {
        return;
    }

    for (let i = 0; i < 3; i++) {
        const message: ApplyChangeMessage = {
            type: 'applyChange',
            change: change.toJsonObject(),
        };
        const response = await chrome.runtime.sendMessage(message);
        if (response && 'success' in response && response.success !== true) {
            await sleep(5000);
            console.log("Error applying change, retrying", response);
            continue;
        }
        await sleep(2000);
        const timeout = Date.now() + 10 * 1000;
        var refreshCount = 10;
        while (Date.now() < timeout) {
            await sleep(100);
            updateChangeWithState(change);
            if(!change.hasChanges()) {
                await sleep(100);
                return;
            }
            if (--refreshCount <= 0) {
                getTrailData();
                refreshCount = 10;
            }
        }
    }
    console.log('Failed to update ' + change.trail.name, change);
}

function getTrailData() {
    chrome.runtime.sendMessage({ type: 'getTrailData' }, (r) =>
        handleMessages(r, null, null)
    );
}

window.addEventListener('load', function () {
    document
        .querySelector('#section-changes-preview')!
        .addEventListener('click', previewChanges);
    document
        .querySelector('#section-preview-apply')!
        .addEventListener('click', applyChanges);
    getTrailData();
});

const handleMessages: MessageHandler = function (
    message,
    sender,
    sendResponse
) {
    if (!isValidMessage(message)) {
        return false;
    }
    if (message.type === 'trailData') {
        handleTrailDataMessage(<TrailDataMessage>message);
        for (const section of state.sections) {
            addSection(section);
        }
        return false;
    }

    return false;
};

chrome.runtime.onMessage.addListener(handleMessages);

declare global {
    interface Window {
        state: State;
    }
}
window.state = state;

export {};
