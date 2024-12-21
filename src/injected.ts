import {
    getTrailsListTable,
    getInternalTrailCrList,
    getTrailsListAngularComponent,
    getTrailsFromAngular,
} from './util/loaders';
import type { Trail } from './util/trail';
import { debounce } from './util/util';

type InjectedState = {
    retries: number;
};

const state: InjectedState = { retries: 10 };

function sortTrails(trailsComponent: any): void {
    const trails: Trail[] = getTrailsFromAngular(trailsComponent);
    trails.sort((a, b) => a!.compareTo(b!));
    trailsComponent.rowData = trails.map((trail) => trail!.ngRow);
}

function addSectionToTable(trailsComponent: any) {
    const trailsFromAgular: Trail[] = getTrailsFromAngular(trailsComponent);
    const table = getTrailsListTable()!;
    const rows = table.querySelector('tbody')!.querySelectorAll('tr')!;
    const header = table.querySelector('thead')!;
    const nameHeader = header.querySelector('th.col-name')!;
    var sectionHeader: Element | null = header.querySelector('th.col-section');
    if (sectionHeader === null) {
        sectionHeader = <Element>nameHeader.cloneNode(true);
        sectionHeader.textContent = 'Section';
        sectionHeader.className = 'col-section';
        nameHeader.parentNode!.insertBefore(
            sectionHeader,
            nameHeader.nextSibling
        );
    }
    if (rows.length != trailsFromAgular.length) {
        console.error('Row count mismatch between table and angular');
        if (state.retries > 0) {
            setTimeout(sortAndAddSectionToTable, 1000);
            state.retries--;
        }
        return;
    }
    const zipped = Array.from(rows).map((row, index) => {
        return { row, trail: trailsFromAgular[index] };
    });
    for (const { row, trail } of zipped) {
        const trailNameRow = row.querySelector('td.col-name')!;
        const trailName = trailNameRow.textContent!.trim();
        if (trailName !== trail.name) {
            console.error(
                'Trail name mismatch between table and angular',
                row,
                trail
            );
            if (state.retries > 0) {
                setTimeout(sortAndAddSectionToTable, 1000);
                state.retries--;
            }
            return;
        }

        var sectionName = trail.section ?? 'Unknown';
        const id = trail.idForSection();
        var sectionColRow: Element | null = row.querySelector(`#${id}`);
        if (sectionColRow === null) {
            sectionColRow = <Element>trailNameRow.cloneNode(true);
            sectionColRow.textContent = sectionName;
            sectionColRow.className = 'col-section';
            sectionColRow.id = id;
            trailNameRow.parentNode!.insertBefore(
                sectionColRow,
                trailNameRow.nextSibling
            );
        }
    }
}

const sortAndAddSectionToTable = debounce(() => {
    if (getInternalTrailCrList() !== null) {
        console.log('Sorting and adding sections to table...');
        const trailsComponent = getTrailsListAngularComponent();
        const trails = getTrailsFromAngular(trailsComponent);
        sortTrails(trailsComponent);
        // get them again, so that we have the sorted order
        setTimeout(() => {
            addSectionToTable(getTrailsListAngularComponent());
            state.retries = 10;
        }, 250);
    }
}, 250);

let observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation: MutationRecord) => {
        if (mutation.type !== 'childList') {
            return;
        }
        if (mutation.addedNodes.length === 0) {
            return;
        }
        if (mutation.target.nodeName !== 'TBODY') {
            return;
        }
        const addedNode = mutation.addedNodes[0];
        if (addedNode.nodeName !== 'TR') {
            return;
        }
        sortAndAddSectionToTable();
    });
});

observer.observe(document.body, {
    characterDataOldValue: true,
    subtree: true,
    childList: true,
    characterData: true,
});

declare global {
    interface Window {
        getTrailsListAngularComponent: () => any;
    }
}

window.getTrailsListAngularComponent = getTrailsListAngularComponent;
