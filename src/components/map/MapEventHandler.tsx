
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapEventHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

const MapEventHandler: React.FC<MapEventHandlerProps> = ({ onMapClick }) => {
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

export default MapEventHandler;
