import type { Change } from './change';
import type { Trail } from './trail';

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

export { state, getTrailFromState };
export type { State };
