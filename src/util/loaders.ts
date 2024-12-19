import { Trail } from './trail';

function getCrList(extensionId: string) {
    return document.querySelector(`cr-list[extensionid="${extensionId}"]`);
}
function getInternalTrailCrList() {
    return getCrList('internalTrail');
}
function getInternalLiftCrList() {
    return getCrList('internalLift');
}
function getTrailsListTable() {
    return getInternalTrailCrList()!.querySelector('table');
}

const _ng: any = (<any>window)['ng'];

function getTrailsListAngularComponent() {
    return _ng.getComponent(getInternalTrailCrList());
}
function getTrailsFromAngular(angularComponent: any) {
    return [...angularComponent.rowData].map(
        (trail) => Trail.fromNgRow(trail)!
    );
}
function getTrailsFromDom(trailsListTable: Element) {
    const rows: NodeListOf<HTMLTableRowElement> = trailsListTable
        .querySelector('tbody')!
        .querySelectorAll('tr')!;
    return [...rows].map((row) => Trail.fromDomRow(row)!);
}

export {
    getCrList,
    getInternalTrailCrList,
    getInternalLiftCrList,
    getTrailsListTable,
    getTrailsListAngularComponent,
    getTrailsFromAngular,
    getTrailsFromDom,
};
