import { getIconForTrailRating } from './util/constants';
import { Trail } from './util/trail';
import { capitalize, createElement } from './util/util';
require('./sidepanel.scss');

const state: { states: string[]; sections: string[]; trails: Trail[] } = {
    states: [],
    sections: [],
    trails: [],
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
    const changes = [];
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
                changes.push({
                    trailName: trail.name,
                    trail: trail,
                    operationStatus: {
                        from: trail.operationStatus,
                        to: changeCommand.to,
                    },
                });
            }
        }
    }
    const listItem = createElement(`
        <div class="list-group mb-3">
        </div>
            `);
    for (const change of changes) {
        const listGroupItem = createElement(`
             <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-start">
                <div class="me-auto">
                    <div class="fw-bold">${change.trail.name} ${getIconForTrailRating(change.trail.rating)}</div>
                    <div>Operation Status:</div>
                    ${capitalize(change.operationStatus.from)} -> ${capitalize(
            change.operationStatus.to
        )}
                </div>
                <input class="me-1" type="checkbox" checked="true" value="true">
            </a>
            `);
        listGroupItem.addEventListener('onclick', function () {
            const input = listGroupItem.querySelector('input')!;
            input.checked = !input.checked;
            const div = listGroupItem.querySelector('div.me-auto')!;
            if (input.checked) {
                div.classList.remove('opacity-25');
            } else {
                div.classList.add('opacity-25');
            }
            return false;
        });
        listItem.appendChild(listGroupItem);
    }
    const previewContainer = document.querySelector(
        '#section-preview-container'
    )!;
    previewContainer.appendChild(listItem);
}

window.addEventListener('load', function () {
    document
        .querySelector('#section-changes-preview')!
        .addEventListener('click', previewChanges);
    chrome.runtime.sendMessage({ type: 'getTrailData' });
});

// Event listener
function handleMessages(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
) {
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

export {};
