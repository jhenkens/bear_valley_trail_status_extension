import { Change } from './util/change';
import { getIconForTrailRating } from './util/constants';
import { Trail } from './util/trail';
import { capitalize, createElement, sleep } from './util/util';
require('./sidepanel.scss');
import 'bootstrap-icons/font/bootstrap-icons.css'


type State = {
    states: string[];
    sections: string[];
    trails: Trail[];
    changes: Change[];
};
const state: State = {
    states: [],
    sections: [],
    trails: [],
    changes: [],
};

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
    const options = state.states
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
        <span><button type="button" class="btn-close" aria-label="Close"></button></span>
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
                (changeCommand.from === '*' ||
                    changeCommand.from === trail.operationStatus) &&
                changeCommand.to !== trail.operationStatus
            ) {
                changes.push(
                    new Change(trail, { operationalStatus: changeCommand.to })
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
        if (change.changeSet.operationalStatus == undefined) {
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
                        change.trail.operationStatus
                    )} -> ${capitalize(change.changeSet.operationalStatus)}
                </div>
                <div>
                    <input class="me-1" type="checkbox" checked="true" value="true">
                    <div>
                        <div class="d-none bv-applying spinner-border spinner-border-sm" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <i class="d-none bv-done bi bi-check-circle-fill green"></i>
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

async function applyChanges() {
    const changes = state.changes.filter((change) => change.enabled);
    const changesCount = changes.length;
    var current = 0;
    document.querySelector('#section-preview-apply')!.textContent =
        'Applying changes...';
    updateProgressBar(current, changesCount);
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
        changeRow.querySelector('.bv-applying')!.classList.remove('d-none');
        await applyChange(change);
        updateProgressBar(++current, changesCount);
        changeRow.querySelector('.bv-applying')!.classList.add('d-none');
        changeRow.querySelector('.bv-done')!.classList.remove('d-none');
    }
}

function getTrailFromState(id: String | null): Trail | null {
    if (id === null) {
        return null;
    }

    for (const trail of state.trails) {
        if (trail.id === id) {
            return trail;
        }
    }
    return null;
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

    const response = await chrome.runtime.sendMessage({
        type: 'applyChange',
        change: change.toJsonObject(),
    });

    const timeout = Date.now() + 60 * 1000;
    while (Date.now() < timeout) {
        const newTrail = getTrailFromState(change.trail.id);
        if (newTrail != null) {
            change.trail = newTrail;
            if (!change.hasChanges()) {
                await sleep(1000);
                return;
            }
        }
        await sleep(100);
    }
    console.log('Failed to update ' + change.trail.name, change);
}

window.addEventListener('load', function () {
    document
        .querySelector('#section-changes-preview')!
        .addEventListener('click', previewChanges);
    document
        .querySelector('#section-preview-apply')!
        .addEventListener('click', applyChanges);
    chrome.runtime.sendMessage({ type: 'getTrailData' }, handleMessages);
});

// Event listener
function handleMessages(
    message: any,
    sender: chrome.runtime.MessageSender | null = null,
    sendResponse: ((response?: any) => void) | null = null
) {
    if (message === null || message === undefined || !('type' in message)) {
        return false;
    }
    if (message.type === 'trailData') {
        state.sections = message.sections;
        state.states = message.states;
        state.trails = message.trails
            .map(Trail.fromJsonObject)
            .sort((a: Trail, b: Trail) => a.compareTo(b));
        for (const section of state.sections) {
            addSection(section);
        }
        return false;
    }

    return false;
}

chrome.runtime.onMessage.addListener(handleMessages);


declare global {
    interface Window {
        state: State
    }
}
window.state = state;

export {};
