import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const BoatMap: React.FC<{ onAddWaypoint?: (lat: number, lng: number) => void }> = ({ onAddWaypoint }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [tokenInput, setTokenInput] = useState<string>("");
  const waypointsRef = useRef<mapboxgl.Marker[]>([]);
  
  // Existing waypoints
  const initialWaypoints = [
    { id: 1, lat: 37.8021, lng: -122.4186, name: "Waypoint 1" },
    { id: 2, lat: 37.8225, lng: -122.3788, name: "Waypoint 2" }
  ];

  // Initialize the map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Validate that the token starts with 'pk.'
    if (!mapboxToken.startsWith('pk.')) {
      alert('Please enter a valid Mapbox PUBLIC access token (starts with pk.)');
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    
    if (map.current) return;
    
    console.log("Initializing map");
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
      
      console.log("Map loaded, adding waypoints");
      // Add waypoints
      initialWaypoints.forEach(waypoint => {
        const el = document.createElement('div');
        el.className = 'waypoint-marker';
        el.innerHTML = `<div class="flex items-center justify-center w-6 h-6 bg-marine-blue text-white rounded-full shadow-md">
                          <span class="text-xs font-bold">${waypoint.id}</span>
                        </div>`;
        
        const marker = new mapboxgl.Marker(el)
          .setLngLat([waypoint.lng, waypoint.lat])
          .addTo(map.current!);
        
        waypointsRef.current.push(marker);
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
      
      try {
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
      } catch (error) {
        console.warn("Could not add boat icon layer:", error);
        
        // Fallback to a circle if icon is missing
        map.current.addLayer({
          id: 'boat',
          type: 'circle',
          source: 'boat',
          paint: {
            'circle-radius': 8,
            'circle-color': '#3887be',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });
      }
    });

    // Handle click to add waypoint
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      console.log("Map clicked at:", lat, lng);
      
      if (onAddWaypoint) {
        onAddWaypoint(lat, lng);
        
        // Visualize the new waypoint on the map without recreating it
        const waypointId = waypointsRef.current.length + 1;
        const el = document.createElement('div');
        el.className = 'waypoint-marker';
        el.innerHTML = `<div class="flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full shadow-md">
                          <span class="text-xs font-bold">${waypointId}</span>
                        </div>`;
        
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);
        
        waypointsRef.current.push(marker);
        
        // Update path if we have at least 2 waypoints
        if (map.current?.getSource('route') && waypointsRef.current.length >= 2) {
          const coordinates = waypointsRef.current.map(marker => {
            const lngLat = marker.getLngLat();
            return [lngLat.lng, lngLat.lat];
          });
          
          (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates
            }
          });
        }
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
          <h3 className="text-lg font-medium text-gray-700 mb-2">Mapbox PUBLIC API Token Required</h3>
          <p className="text-sm text-gray-500 mb-4">
            Please enter your Mapbox PUBLIC token to display the map. 
            <br />
            <strong>Important:</strong> The token must start with 'pk.'
            <br />
            Get one from your 
            <a 
              href="https://account.mapbox.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 hover:text-blue-700"
            > Mapbox account</a>.
          </p>
        </div>
        <div className="flex w-full max-w-md">
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6...EXAMPLE"
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
