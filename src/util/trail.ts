import type { TrailRating } from './constants';
import { AUTOMATIC_STATUS, getSectionOrder, getTrailRating } from './constants';
import {
    compareStrings,
    parseActiveInactiveExact,
    parseBoolExact,
} from './util';

type TrailJson = {
    name: string;
    section: string | null;
    id: string | null;
    operationStatus: string;
    groomingStatus: boolean;
    snowmakingStatus: boolean;
    automaticStatus: boolean;
    statusOverride: string | null;
    rating: TrailRating;
};

class Trail {
    name: string;
    section: string | null;
    id: string | null;
    operationStatus: string;
    groomingStatus: boolean;
    snowmakingStatus: boolean;
    automaticStatus: boolean;
    statusOverride: string | null;
    rating: TrailRating;
    domRow: HTMLTableRowElement | null = null;
    ngRow: any = null;

    constructor(
        name: string,
        section: string | null,
        id: string | null,
        operationStatus: string,
        groomingStatus: boolean,
        snowmakingStatus: boolean,
        automaticStatus: boolean,
        statusOverride: string | null,
        rating: TrailRating,
        origin: { domRow: HTMLTableRowElement } | { ngRow: any } | null = null
    ) {
        this.name = name;
        this.section = section;
        this.id = id;
        this.operationStatus = operationStatus;
        this.groomingStatus = groomingStatus;
        this.snowmakingStatus = snowmakingStatus;
        this.automaticStatus = automaticStatus;
        this.statusOverride = statusOverride;
        this.rating = rating;
        if (origin !== null) {
            if ('domRow' in origin) {
                this.domRow = origin.domRow;
            } else if ('ngRow' in origin) {
                this.ngRow = origin.ngRow;
            }
        }
    }

    public get effectiveStatus(): string | null {
        return this.automaticStatus ? AUTOMATIC_STATUS : this.statusOverride;
    }

    public idForSection(): string {
        return `trail-${this.id}-section`;
    }

    public static parseIdFromSectionId(sectionId: string): string {
        return sectionId.split('-').slice(1, -1).join('-');
    }

    public compareTo(other: Trail): number {
        if (this.section !== other.section) {
            return (
                getSectionOrder(this.section) - getSectionOrder(other.section)
            );
        }
        if (this.rating !== other.rating) {
            return this.rating.valueOf() - other.rating.valueOf();
        }
        return compareStrings(this.name, other.name);
    }

    public static fromDomRow(row: HTMLTableRowElement): Trail | null {
        const trailName = row.querySelector('td.col-name')!.textContent!.trim();
        const sectionColRow = row.querySelector('td.col-section');
        var id: string | null = null;
        var section: string | null = null;
        if (sectionColRow !== null) {
            id = this.parseIdFromSectionId(sectionColRow.id);
            section = sectionColRow.textContent?.trim() ?? null;
        }
        const operationStatus = row
            .querySelector('td.col-operation-status')!
            .textContent!.toLowerCase();
        const automaticStatus = row
            .querySelector('td.col-automatic-status div.cr-toggle-message')!
            .textContent!.toLowerCase();
        const statusOverride = row
            .querySelector(
                'td.col-status-override div[data-local-qa-id="dropdown"] div.selection-text'
            )!
            .textContent!.toLowerCase()
            .trim();
        const groomingStatus = row
            .querySelector('td.col-grooming-status div.cr-toggle-message')!
            .textContent!.toLowerCase();
        const snowmakingStatus = row
            .querySelector('td.col-snowmaking-status div.cr-toggle-message')!
            .textContent!.toLowerCase();
        const trailIconStyle = row
            .querySelector('td.col-icon div')!
            .attributes.getNamedItem('style')!.value;
        const trailIconUrlIndex = trailIconStyle.indexOf('url(');
        const trailIconUrl = trailIconStyle.substring(
            trailIconUrlIndex + 4,
            trailIconStyle.indexOf(')', trailIconUrlIndex) - 1
        );
        const rating = getTrailRating(
            trailIconUrl.split('/').pop()!.split('.')[0]
        );
        return new Trail(
            trailName,
            section,
            id,
            operationStatus,
            parseBoolExact(groomingStatus),
            parseBoolExact(snowmakingStatus),
            parseActiveInactiveExact(automaticStatus),
            statusOverride,
            rating,
            { domRow: row }
        );
    }

    public static fromNgRow(row: any): Trail | null {
        const trailName = row.data.name.trim();
        const sectionName = row.data._extension.value.mountainArea.trim();
        const id = row.data.id;
        const operationStatus = row.data.operationStatus.label.toLowerCase();
        const statusOverride =
            row.data.statusOptions
                .find((e: any) => e.isSelected)
                ?.label?.toLowerCase()
                ?.trim() ?? null;
        const automaticStatus = row.data.autoStatus;
        const groomingStatus = row.data.grooming;
        const snowmakingStatus = row.data.snowMaking;
        const rating = getTrailRating(row.data.iconType);
        return new Trail(
            trailName,
            sectionName,
            id,
            operationStatus,
            groomingStatus,
            snowmakingStatus,
            automaticStatus,
            statusOverride,
            rating,
            { ngRow: row }
        );
    }

    public static fromJsonObject({
        name,
        section,
        id,
        operationStatus,
        groomingStatus,
        snowmakingStatus,
        automaticStatus,
        statusOverride,
        rating,
    }: TrailJson): Trail {
        return new Trail(
            name,
            section,
            id,
            operationStatus,
            groomingStatus,
            snowmakingStatus,
            automaticStatus,
            statusOverride,
            rating
        );
    }

    public toJsonObject(): TrailJson {
        return {
            name: this.name,
            section: this.section,
            id: this.id,
            operationStatus: this.operationStatus,
            groomingStatus: this.groomingStatus,
            snowmakingStatus: this.snowmakingStatus,
            automaticStatus: this.automaticStatus,
            statusOverride: this.statusOverride,
            rating: this.rating,
        };
    }
}

export { Trail };
export type { TrailJson };
