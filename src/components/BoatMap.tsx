
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { createBoatIcon } from '@/utils/leafletUtils';
import FixLeafletIcon from '@/components/map/FixLeafletIcon';
import MapEventHandler from '@/components/map/MapEventHandler';
import { BoatMapProps, Waypoint } from '@/types/map';

const BoatMap: React.FC<BoatMapProps> = ({ onAddWaypoint }) => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    { id: 1, lat: 37.8021, lng: -122.4186, name: "Waypoint 1" },
    { id: 2, lat: 37.8225, lng: -122.3788, name: "Waypoint 2" }
  ]);
  
  // Boat position
  const boatPosition: [number, number] = [37.810, -122.405];
  
  // Boat icon
  const boatIcon = createBoatIcon();
  
  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    if (onAddWaypoint) {
      onAddWaypoint(lat, lng);
      
      // Add to local waypoints for visualization
      const newWaypoint: Waypoint = {
        id: waypoints.length + 1,
        lat,
        lng,
        name: `Waypoint ${waypoints.length + 1}`
      };
      
      setWaypoints(prev => [...prev, newWaypoint]);
    }
  };
  
  // Generate path coordinates for polyline
  const pathCoordinates = waypoints.map(wp => [wp.lat, wp.lng] as [number, number]);
  
  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-marine-border">
      <MapContainer 
        center={[37.81, -122.4]} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }} 
        zoomControl={false}
      >
        <FixLeafletIcon />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Nautical chart layer - alternative for maritime use */}
        {/* Uncomment to use nautical charts (requires registration) 
        <TileLayer
          attribution='&copy; <a href="https://openseamap.org/">OpenSeaMap</a> contributors'
          url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
        />
        */}
        
        {/* Boat Marker */}
        <Marker position={boatPosition} icon={boatIcon}>
          <Popup>Boat Location</Popup>
        </Marker>
        
        {/* Waypoint Markers */}
        {waypoints.map((waypoint) => (
          <Marker 
            key={waypoint.id} 
            position={[waypoint.lat, waypoint.lng]}
          >
            <Popup>{waypoint.name}</Popup>
          </Marker>
        ))}
        
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
