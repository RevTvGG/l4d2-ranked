export const MAP_IMAGES: Record<string, string> = {
    'Dead Center': '/maps/dead_center.jpg',
    'Dark Carnival': '/maps/dark_carnival.jpg',
    'Swamp Fever': '/maps/swamp_fever.jpg',
    'Hard Rain': '/maps/hard_rain.jpg',
    'The Parish': '/maps/the_parish.jpg',
    'The Passifice': '/maps/the_passifice.jpg',
    'No Mercy': '/maps/no_mercy.jpg',
    'Crash Course': '/maps/crash_course.jpg', // Often uses generic l4d1 image
    'Death Toll': '/maps/death_toll.jpg',
    'Dead Air': '/maps/dead_air.jpg',
    'Blood Harvest': '/maps/blood_harvest.jpg',
    'Cold Stream': '/maps/cold_stream.jpg',
};

export function getMapImage(mapName: string): string {
    return MAP_IMAGES[mapName] || '/maps/no_mercy.jpg';
}
