import {
    getTrailsListTable,
    getInternalTrailCrList,
    getTrailsListAngularComponent,
    getTrailsFromAngular,
} from './util/loaders';
import type { Trail } from './util/trail';
import { debounce } from './util/util';

function sortTrails(trailsComponent: any, trails: Trail[]): void {
    trails.sort((a, b) => a!.compareTo(b!));
    trailsComponent.rowData = trails.map((trail) => trail!.ngRow);
}

function addSectionToTable(trailsFromAgular: Trail[]) {
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
    for (const row of rows) {
        const trailNameRow = row.querySelector('td.col-name')!;
        const trailName = trailNameRow.textContent!.trim();
        const allTrailData = trailsFromAgular.filter(
            (trail) => trail.name === trailName
        );
        const trailData = allTrailData.length > 0 ? allTrailData[0] : null;

        var sectionName = trailData?.section ?? 'Unknown';
        var sectionColRow: Element | null = row.querySelector('td.col-section');
        if (sectionColRow === null) {
            sectionColRow = <Element>trailNameRow.cloneNode(true);
            sectionColRow.textContent = sectionName;
            sectionColRow.className = 'col-section';
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
        sortTrails(trailsComponent, trails);
        addSectionToTable(trails);
    }
});

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
