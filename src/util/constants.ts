const sectionMappings: Array<[RegExp, number]> = [
    [new RegExp(/^\s*Front\s*side\s*-\s*Koala.*/, 'i'), 2],
    [new RegExp(/^\s*Frontside.*/, 'i'), 1],
    [new RegExp(/^\s*Lower\s*Mountain\s*-\s*Grizz.*/, 'i'), 3],
    [new RegExp(/^\s*Lower\s*Mountain\s*-.*/, 'i'), 3.5],
    [new RegExp(/^\s*Backside.*/, 'i'), 4],
    [new RegExp(/^\s*Village.*/, 'i'), 5],
];

enum TrailRating {
    Green = 1,
    Blue = 2,
    Black = 3,
    DoubleBlack = 4,
    Unknown = 100,
}

function getIconForTrailRating(rating: TrailRating): string {
    function _helper(r: TrailRating): string {
        switch (r) {
            case TrailRating.Green:
                return 'bi-circle-fill green';
            case TrailRating.Blue:
                return 'bi-square-fill blue';
            case TrailRating.Black:
            case TrailRating.DoubleBlack:
                return 'bi-diamond-fill black';
            default:
                return 'bi-question-circle';
        }
    }
    const i = "<i class='bi " + _helper(rating) + "'></i>";
    if (rating === TrailRating.DoubleBlack) {
        return i + i;
    }
    return i;
}

const trailIconMappings: Array<[RegExp, TrailRating]> = [
    [new RegExp(/^\s*Green.*/, 'i'), TrailRating.Green],
    [new RegExp(/^\s*Blue.*/, 'i'), TrailRating.Blue],
    [new RegExp(/^\s*Black.*/, 'i'), TrailRating.Black],
    [new RegExp(/^\s*DoubleBlack.*/, 'i'), TrailRating.DoubleBlack],
];

const exactSectionMappings: Map<string, number> = new Map();

const exactTrailIconMappings: Map<string, TrailRating> = new Map();

function lookupStringInMappings<T>(
    mappings: Array<[RegExp, T]>,
    exactMappings: Map<string, T>,
    input: string | null,
    defaultValue: T
): T {
    if (input === null) {
        return defaultValue;
    }
    if (!(input in exactMappings)) {
        function _calculate() {
            for (const [value, order] of mappings) {
                if (value.test(input!)) {
                    return order;
                }
            }
            return defaultValue;
        }
        exactMappings.set(input, _calculate());
    }
    return exactMappings.get(input)!;
}

function getSectionOrder(sectionName: string | null): number {
    return lookupStringInMappings(
        sectionMappings,
        exactSectionMappings,
        sectionName,
        100
    );
}

function getTrailRating(trailIconName: string): TrailRating {
    return lookupStringInMappings(
        trailIconMappings,
        exactTrailIconMappings,
        trailIconName,
        TrailRating.Unknown
    );
}

export { TrailRating, getSectionOrder, getTrailRating, getIconForTrailRating };
