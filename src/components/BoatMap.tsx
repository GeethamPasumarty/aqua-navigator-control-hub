import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Plus } from 'lucide-react';

interface BoatMapProps {
  onAddWaypoint?: (lat: number, lng: number) => void;
}

const BoatMap: React.FC<BoatMapProps> = ({ onAddWaypoint }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [tokenInput, setTokenInput] = useState<string>("");

  // Existing waypoints
  const initialWaypoints = [
    { id: 1, lat: 37.8021, lng: -122.4186, name: "Waypoint 1" },
    { id: 2, lat: 37.8225, lng: -122.3788, name: "Waypoint 2" }
  ];

  // Initialize the map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    if (map.current) return;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-day-v1',
      center: [-122.4, 37.81],
      zoom: 12
    });

    // Add controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add existing waypoints and path
    map.current.on('load', () => {
      if (!map.current) return;
      
      // Add waypoints
      initialWaypoints.forEach(waypoint => {
        const el = document.createElement('div');
        el.className = 'waypoint-marker';
        el.innerHTML = `<div class="flex items-center justify-center w-6 h-6 bg-marine-blue text-white rounded-full shadow-md">
                          <span class="text-xs font-bold">${waypoint.id}</span>
                        </div>`;
        
        new mapboxgl.Marker(el)
          .setLngLat([waypoint.lng, waypoint.lat])
          .addTo(map.current!);
      });
      
      // Add path between waypoints
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: initialWaypoints.map(wp => [wp.lng, wp.lat])
          }
        }
      });
      
      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#7FA8D7',
          'line-width': 4,
          'line-dasharray': [0, 2]
        }
      });

      // Add boat position
      const boatPosition = [-122.405, 37.81];
      
      map.current.addSource('boat', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: boatPosition
          }
        }
      });
      
      map.current.addLayer({
        id: 'boat',
        type: 'symbol',
        source: 'boat',
        layout: {
          'icon-image': 'ferry-15',
          'icon-size': 1.5,
          'icon-allow-overlap': true,
          'icon-rotate': 45
        }
      });
    });

    // Handle click to add waypoint
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      if (onAddWaypoint) {
        onAddWaypoint(lat, lng);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, onAddWaypoint]);

  if (!mapboxToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50 rounded-lg border border-marine-border">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Mapbox API Token Required</h3>
          <p className="text-sm text-gray-500 mb-4">
            Please enter your Mapbox public token to display the map. You can get one from your 
            <a href="https://account.mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700"> Mapbox account</a>.
          </p>
        </div>
        <div className="flex w-full max-w-md">
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="pk.eyJ1IjoibWFwYm94LXVzZXIiLCJhIjoiY2o5..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setMapboxToken(tokenInput)}
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Set Token
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-marine-border">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
};

export default BoatMap;
