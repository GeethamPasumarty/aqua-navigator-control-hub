
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus } from 'lucide-react';

interface WaypointFormProps {
  onAddWaypoint: (waypoint: { name: string; lat: number; lng: number }) => void;
}

const WaypointForm: React.FC<WaypointFormProps> = ({ onAddWaypoint }) => {
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      return;
    }
    
    onAddWaypoint({
      name: name || `Waypoint ${Date.now()}`,
      lat,
      lng
    });
    
    // Reset form
    setName("");
    setLatitude("");
    setLongitude("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-marine-border p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Waypoint</h3>
      
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-3">
          <Label htmlFor="waypoint-name" className="text-xs">Name</Label>
          <Input
            id="waypoint-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Waypoint"
            className="h-9"
          />
        </div>
        
        <div className="col-span-4">
          <Label htmlFor="waypoint-lat" className="text-xs">Latitude</Label>
          <Input
            id="waypoint-lat"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="37.7749"
            className="h-9"
            required
          />
        </div>
        
        <div className="col-span-4">
          <Label htmlFor="waypoint-lng" className="text-xs">Longitude</Label>
          <Input
            id="waypoint-lng"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="-122.4194"
            className="h-9"
            required
          />
        </div>
        
        <div className="col-span-1 flex items-end">
          <Button type="submit" size="sm" className="w-full h-9 bg-marine-blue-dark hover:bg-marine-blue-dark/90">
            <Plus size={16} />
          </Button>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Tip: You can also click directly on the map to add a waypoint
      </div>
    </form>
  );
};

export default WaypointForm;
