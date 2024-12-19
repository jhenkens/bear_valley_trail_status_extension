import type { TrailRating } from './constants';
import { getSectionOrder, getTrailRating } from './constants';
import { compareStrings, parseBoolExact } from './util';

class Trail {
    name: string;
    section: string | null;
    operationStatus: string;
    groomingStatus: boolean;
    snowmakingStatus: boolean;
    rating: TrailRating;
    domRow: HTMLTableRowElement | null = null;
    ngRow: any = null;

    constructor(
        name: string,
        section: string | null,
        operationStatus: string,
        groomingStatus: boolean,
        snowmakingStatus: boolean,
        rating: TrailRating,
        origin: { domRow: HTMLTableRowElement } | { ngRow: any } | null = null
    ) {
        this.name = name;
        this.section = section;
        this.operationStatus = operationStatus;
        this.groomingStatus = groomingStatus;
        this.snowmakingStatus = snowmakingStatus;
        this.rating = rating;
        if (origin !== null) {
            if ('domRow' in origin) {
                this.domRow = origin.domRow;
            } else if ('ngRow' in origin) {
                this.ngRow = origin.ngRow;
            }
        }
    }

    public compareTo(other: Trail): number {
        if (this.section !== other.section) {
            return getSectionOrder(this.section) - getSectionOrder(other.section);
        }
        if (this.rating !== other.rating) {
            return this.rating.valueOf() - other.rating.valueOf();
        }
        return compareStrings(this.name, other.name);
    }

    public static fromDomRow(row: HTMLTableRowElement): Trail | null {
        const trailName = row.querySelector('td.col-name')!.textContent!.trim();
        const sectionName: string | undefined = row
            .querySelector('td.col-section')
            ?.textContent?.trim();
        const operationStatus = row
            .querySelector('td.col-operation-status')!
            .textContent!.toLowerCase();
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
            sectionName ?? null,
            operationStatus,
            parseBoolExact(groomingStatus),
            parseBoolExact(snowmakingStatus),
            rating,
            { domRow: row }
        );
    }

    public static fromNgRow(row: any): Trail | null {
        const trailName = row.data.name.trim();
        const sectionName = row.data._extension.value.mountainArea.trim();
        const operationStatus = row.data.operationStatus.label.toLowerCase();
        const groomingStatus = row.data.grooming;
        const snowmakingStatus = row.data.snowMaking;
        const rating = getTrailRating(row.data.iconType);
        return new Trail(
            trailName,
            sectionName,
            operationStatus,
            groomingStatus,
            snowmakingStatus,
            rating,
            { ngRow: row }
        );
    }

    public static fromJsonObject({
        name,
        section,
        operationStatus,
        groomingStatus,
        snowmakingStatus,
        rating,
    }: {
        name: string;
        section: string | null;
        operationStatus: string;
        groomingStatus: boolean;
        snowmakingStatus: boolean;
        rating: TrailRating;
    }): Trail {
        return new Trail(
            name,
            section,
            operationStatus,
            groomingStatus,
            snowmakingStatus,
            rating
        );
    }

    public toJsonObject(){
        return {
            name: this.name,
            section: this.section,
            operationStatus: this.operationStatus,
            groomingStatus: this.groomingStatus,
            snowmakingStatus: this.snowmakingStatus,
            rating: this.rating,
        };
    }
}

export { Trail };