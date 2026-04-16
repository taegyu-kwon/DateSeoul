export function placeKeyFromSpot(spot: {
  name: string;
  lat: number;
  lng: number;
}): string {
  const n = spot.name.trim().toLowerCase().replace(/\s+/g, " ");
  return `${n}_${spot.lat.toFixed(4)}_${spot.lng.toFixed(4)}`;
}
