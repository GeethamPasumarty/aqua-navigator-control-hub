
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { createBoatIcon, createWaypointIcon } from '@/utils/leafletUtils';
import FixLeafletIcon from '@/components/map/FixLeafletIcon';
import MapEventHandler from '@/components/map/MapEventHandler';

interface Waypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order_index: number;
}

interface BoatMapProps {
  onAddWaypoint?: (lat: number, lng: number) => void;
  existingWaypoints?: Waypoint[];
  boatPosition?: [number, number];
}

const BoatMap: React.FC<BoatMapProps> = ({ 
  onAddWaypoint, 
  existingWaypoints = [],
  boatPosition = [37.810, -122.405]
}) => {
  // Boat icon
  const boatIcon = createBoatIcon();
  
  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    if (onAddWaypoint) {
      onAddWaypoint(lat, lng);
    }
  };
  
  // Generate path coordinates for polyline
  const pathCoordinates = existingWaypoints
    .sort((a, b) => a.order_index - b.order_index)
    .map(wp => [wp.latitude, wp.longitude] as [number, number]);
  
  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-marine-border">
      <MapContainer 
        center={boatPosition} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }} 
        zoomControl={false}
      >
        <FixLeafletIcon />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Boat Marker */}
        <Marker position={boatPosition} icon={boatIcon}>
          <Popup>Boat Location</Popup>
        </Marker>
        
        {/* Waypoint Markers */}
        {existingWaypoints.map((waypoint, index) => {
          // Determine if this is the most recent waypoint
          const isLatestWaypoint = index === existingWaypoints.length - 1;
          // Create the appropriate icon based on whether it's the latest
          const waypointIcon = createWaypointIcon(isLatestWaypoint);
          
          return (
            <Marker 
              key={waypoint.id} 
              position={[waypoint.latitude, waypoint.longitude]}
              icon={waypointIcon}
            >
              <Popup>{waypoint.name}</Popup>
            </Marker>
          );
        })}
        
        {/* Path between waypoints */}
        {pathCoordinates.length > 1 && (
          <Polyline 
            positions={pathCoordinates} 
            color="#7FA8D7" 
            weight={4} 
            dashArray="4,8"
          />
        )}
        
        {/* Map event handler */}
        <MapEventHandler onMapClick={handleMapClick} />
      </MapContainer>
    </div>
  );
};

export default BoatMap;
