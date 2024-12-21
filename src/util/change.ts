import { Trail, type TrailJson } from './trail';

type ChangeSet = {
    statusOverride?: string;
};
type ChangeJson = {
    trail: TrailJson;
    changeSet: ChangeSet;
};

class Change {
    trail: Trail;
    changeSet: ChangeSet;
    enabled: boolean = true;

    constructor(trail: Trail, changeSet: ChangeSet) {
        this.trail = trail;
        this.changeSet = changeSet;
    }

    public compareTo(other: Change): number {
        return this.trail.compareTo(other.trail);
    }

    public static fromJsonObject({ trail, changeSet }: ChangeJson): Change {
        return new Change(Trail.fromJsonObject(trail), changeSet);
    }

    public toJsonObject(): ChangeJson {
        return {
            trail: this.trail.toJsonObject(),
            changeSet: this.changeSet,
        };
    }

    public hasChanges() {
        if (
            this.changeSet.statusOverride !== undefined &&
            this.changeSet.statusOverride !== this.trail.effectiveStatus
        ) {
            return true;
        }
        return false;
    }
}

export { Change };
export type { ChangeJson, ChangeSet };
