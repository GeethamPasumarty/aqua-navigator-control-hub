
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';

interface BoatMapProps {
  onAddWaypoint?: (lat: number, lng: number) => void;
}

// Custom boat icon
const boatIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzODg3YmUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1uYXZpZ2F0aW9uIj48cG9seWdvbiBwb2ludHM9IjMgMTEgMjIgMiAxMyAyMSAxMiAxNyAzIDExIi8+PC9zdmc+',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

// Component to handle map clicks and update center
const MapEventHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
};

// This needs to be inside the component to ensure React lifecycle hooks work properly
const FixLeafletIcon = () => {
  useEffect(() => {
    // Fix the default icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);
  
  return null;
};

const BoatMap: React.FC<BoatMapProps> = ({ onAddWaypoint }) => {
  const [waypoints, setWaypoints] = useState<Array<{ lat: number, lng: number, id: number, name: string }>>([
    { id: 1, lat: 37.8021, lng: -122.4186, name: "Waypoint 1" },
    { id: 2, lat: 37.8225, lng: -122.3788, name: "Waypoint 2" }
  ]);
  
  // Boat position
  const boatPosition: [number, number] = [37.810, -122.405];
  
  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    if (onAddWaypoint) {
      onAddWaypoint(lat, lng);
      
      // Add to local waypoints for visualization
      const newWaypoint = {
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
