import { geoAlbersUsa } from "d3-geo";

// Standard Albers USA projection settings matching the @svg-maps/usa viewBox of 959x593
// The @svg-maps/usa is typically generated from standard TopoJSON but might be centered slightly differently.
// D3's Albers USA default translate is [480, 250] for a 960x500 map.
// Our map is 959x593.
// Let's calibrate: 
// Center X: 959 / 2 ~ 480
// Center Y: 593 / 2 ~ 296
// Scale: Default is 1070. Increasing purely zooms in.
const projection = geoAlbersUsa()
    .scale(1300)
    .translate([480, 300]);

// We need a way to ensure this matches. 
// If the SVG map is standard, this should work.
export function projectCoordinates(lat: number, lng: number): [number, number] | null {
    const coords = projection([lng, lat]);
    if (!coords) return null;
    return coords;
}
