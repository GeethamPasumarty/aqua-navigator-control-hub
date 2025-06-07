
import React, { useEffect } from 'react';
import BoatMap from '@/components/BoatMap';
import StatusPanel from '@/components/StatusPanel';
import SensorStatus from '@/components/SensorStatus';
import CameraFeed from '@/components/CameraFeed';
import ControlPanel from '@/components/ControlPanel';
import WaypointForm from '@/components/WaypointForm';
import LogPanel from '@/components/LogPanel';
import { useToast } from "@/hooks/use-toast";
import { useVesselData } from '@/hooks/useVesselData';
import { useSensors } from '@/hooks/useSensors';
import { useWaypoints } from '@/hooks/useWaypoints';
import { useLogs } from '@/hooks/useLogs';
import { useCameras } from '@/hooks/useCameras';

const Index = () => {
  const { toast } = useToast();
  const { vessel, loading: vesselLoading, updateVessel } = useVesselData();
  const { sensors, updateSensorStatus, setSensors } = useSensors(vessel?.id);
  const { waypoints, addWaypoint } = useWaypoints(vessel?.id);
  const { logs, addLogEntry } = useLogs(vessel?.id);
  const { cameras } = useCameras(vessel?.id);

  // Convert cameras to the format expected by CameraFeed
  const cameraOptions = cameras.map(camera => ({
    id: camera.device_id,
    name: camera.name
  }));

  // Handle emergency stop
  const handleEmergencyStop = async () => {
    toast({
      title: "Emergency Stop Activated",
      description: "All motors stopped. Boat in emergency mode.",
      variant: "destructive"
    });
    
    // Add to logs
    await addLogEntry({
      type: 'emergency',
      message: 'Emergency Stop Activated'
    });
    
    // Update motor sensor status
    setSensors(prev => prev.map(sensor => 
      sensor.name.includes('Motor') 
        ? { ...sensor, status: 'offline' as const, last_updated: 'just now' }
        : sensor
    ));

    // Update motor sensors in database
    const motorSensors = sensors.filter(sensor => sensor.name.includes('Motor'));
    for (const sensor of motorSensors) {
      await updateSensorStatus(sensor.id, 'offline');
    }
  };
  
  // Handle reset
  const handleReset = async () => {
    toast({
      title: "System Reset",
      description: "All systems restarting."
    });
    
    // Add to logs
    await addLogEntry({
      type: 'system',
      message: 'System reset initiated'
    });
    
    // Simulate system coming back online
    setTimeout(async () => {
      setSensors(prev => prev.map(sensor => ({ 
        ...sensor, 
        status: 'online' as const, 
        last_updated: 'just now' 
      })));
      
      // Update all sensors in database
      for (const sensor of sensors) {
        await updateSensorStatus(sensor.id, 'online');
      }
      
      await addLogEntry({
        type: 'system',
        message: 'System reset complete'
      });
    }, 2000);
  };
  
  // Handle adding waypoint from map
  const handleAddWaypoint = async (waypoint: { name: string; lat: number; lng: number }) => {
    console.log("Adding waypoint:", waypoint);
    
    await addWaypoint({
      name: waypoint.name,
      latitude: waypoint.lat,
      longitude: waypoint.lng
    });
    
    await addLogEntry({
      type: 'system',
      message: `Waypoint added: ${waypoint.name}`
    });
  };
  
  // Simulate random battery drain
  useEffect(() => {
    if (!vessel) return;

    const interval = setInterval(async () => {
      const newLevel = vessel.battery_percentage - Math.random() * 0.5;
      const batteryLevel = newLevel < 10 ? 92 : newLevel;
      
      await updateVessel({ battery_percentage: Math.round(batteryLevel) });
    }, 30000);
    
    return () => clearInterval(interval);
  }, [vessel, updateVessel]);

  if (vesselLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-marine-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vessel data...</p>
        </div>
      </div>
    );
  }

  if (!vessel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No vessel data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-screen-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          {vessel.name} - Control Hub
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map Section - Left column on large screens, full width on small */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main Map */}
            <div className="h-[500px]">
              <BoatMap 
                onAddWaypoint={(lat, lng) => handleAddWaypoint({ 
                  name: `Waypoint ${waypoints.length + 1}`, 
                  lat, 
                  lng 
                })} 
                existingWaypoints={waypoints}
                boatPosition={vessel.latitude && vessel.longitude ? [vessel.latitude, vessel.longitude] : undefined}
              />
            </div>
            
            {/* Waypoint Form */}
            <WaypointForm onAddWaypoint={handleAddWaypoint} />
            
            {/* Log Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LogPanel title="SYSTEM LOG" entries={logs} type="system" />
              <LogPanel title="EMERGENCY LOG" entries={logs} type="emergency" />
            </div>
          </div>
          
          {/* Control Section - Right column */}
          <div className="space-y-4">
            {/* Status Panel */}
            <StatusPanel 
              batteryPercentage={vessel.battery_percentage} 
              signalStrength={vessel.signal_strength} 
            />
            
            {/* Camera Feed */}
            <CameraFeed 
              cameras={cameraOptions} 
              defaultCamera={cameras.find(c => c.is_active)?.device_id || cameraOptions[0]?.id} 
            />
            
            {/* Control Panel */}
            <ControlPanel onEmergencyStop={handleEmergencyStop} onReset={handleReset} />
            
            {/* Sensor Status */}
            <SensorStatus sensors={sensors} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
