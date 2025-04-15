
export interface Waypoint {
  id: number;
  lat: number;
  lng: number;
  name: string;
}

export interface BoatMapProps {
  onAddWaypoint?: (lat: number, lng: number) => void;
}
