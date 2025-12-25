// Map Pool Configuration for Ranked Matches
// All campaigns play 4 maps (skip finale)
// Exception: Dead Center plays 3 maps

export interface RankedMap {
    id: string;
    name: string;
    campaign: string;
    maps: number;
    startMap: string;
}

export const RANKED_MAP_POOL: RankedMap[] = [
    {
        id: 'c1m1_hotel',
        name: 'Dead Center',
        campaign: 'Dead Center',
        maps: 3, // Exception: only 3 maps
        startMap: 'c1m1_hotel',
    },
    {
        id: 'c2m1_highway',
        name: 'Dark Carnival',
        campaign: 'Dark Carnival',
        maps: 4,
        startMap: 'c2m1_highway',
    },
    {
        id: 'c3m1_plankcountry',
        name: 'Swamp Fever',
        campaign: 'Swamp Fever',
        maps: 4,
        startMap: 'c3m1_plankcountry',
    },
    {
        id: 'c4m1_milltown_a',
        name: 'Hard Rain',
        campaign: 'Hard Rain',
        maps: 4,
        startMap: 'c4m1_milltown_a',
    },
    {
        id: 'c5m1_waterfront',
        name: 'The Parish',
        campaign: 'The Parish',
        maps: 4,
        startMap: 'c5m1_waterfront',
    },
    {
        id: 'c6m1_riverbank',
        name: 'The Passifice',
        campaign: 'The Passifice', // Merged: The Passing + The Sacrifice
        maps: 4,
        startMap: 'c6m1_riverbank',
    },
    {
        id: 'c8m1_apartment',
        name: 'No Mercy',
        campaign: 'No Mercy',
        maps: 4,
        startMap: 'c8m1_apartment',
    },
    {
        id: 'c9m1_alleys',
        name: 'Crash Course',
        campaign: 'Crash Course',
        maps: 4,
        startMap: 'c9m1_alleys',
    },
    {
        id: 'c10m1_caves',
        name: 'Death Toll',
        campaign: 'Death Toll',
        maps: 4,
        startMap: 'c10m1_caves',
    },
    {
        id: 'c11m1_greenhouse',
        name: 'Dead Air',
        campaign: 'Dead Air',
        maps: 4,
        startMap: 'c11m1_greenhouse',
    },
    {
        id: 'c12m1_hilltop',
        name: 'Blood Harvest',
        campaign: 'Blood Harvest',
        maps: 4,
        startMap: 'c12m1_hilltop',
    },
    {
        id: 'c13m1_alpinecreek',
        name: 'Cold Stream',
        campaign: 'Cold Stream',
        maps: 4,
        startMap: 'c13m1_alpinecreek',
    },
];

export function getMapById(id: string): RankedMap | undefined {
    return RANKED_MAP_POOL.find((map) => map.id === id);
}

export function getRandomMap(): RankedMap {
    const randomIndex = Math.floor(Math.random() * RANKED_MAP_POOL.length);
    return RANKED_MAP_POOL[randomIndex];
}
