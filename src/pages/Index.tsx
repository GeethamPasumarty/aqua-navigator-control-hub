
import React, { useState, useEffect } from 'react';
import BoatMap from '@/components/BoatMap';
import StatusPanel from '@/components/StatusPanel';
import SensorStatus from '@/components/SensorStatus';
import CameraFeed from '@/components/CameraFeed';
import ControlPanel from '@/components/ControlPanel';
import WaypointForm from '@/components/WaypointForm';
import LogPanel, { LogEntry } from '@/components/LogPanel';
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  
  // Sample data
  const [batteryLevel, setBatteryLevel] = useState(92);
  const [signalStrength, setSignalStrength] = useState<'none' | 'weak' | 'good' | 'excellent'>('excellent');
  
  const [sensors, setSensors] = useState<Array<{
    id: string;
    name: string;
    status: 'online' | 'offline' | 'warning';
    lastUpdated: string;
  }>>([
    { id: '1', name: 'Camera', status: 'online', lastUpdated: '1m ago' },
    { id: '2', name: 'GPS', status: 'online', lastUpdated: '1m ago' },
    { id: '3', name: 'IMU', status: 'online', lastUpdated: '1m ago' },
    { id: '4', name: 'Depth Sensor', status: 'online', lastUpdated: '2m ago' },
    { id: '5', name: 'Motor Left', status: 'online', lastUpdated: '1m ago' },
    { id: '6', name: 'Motor Right', status: 'online', lastUpdated: '1m ago' }
  ]);
  
  const cameras = [
    { id: 'main', name: 'Main Camera' },
    { id: 'bow', name: 'Bow Camera' },
    { id: 'stern', name: 'Stern Camera' }
  ];

  // Store waypoints state
  const [waypoints, setWaypoints] = useState<Array<{
    id: number;
    name: string;
    lat: number;
    lng: number;
  }>>([]);
  
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'system', message: 'System initialized', timestamp: '10:30:45' },
    { id: '2', type: 'system', message: 'Mission started', timestamp: '10:31:12' },
    { id: '3', type: 'system', message: 'Waypoint 1 reached', timestamp: '10:45:30' },
    { id: '4', type: 'emergency', message: 'Obstacle detected', timestamp: '10:42:15' },
    { id: '5', type: 'system', message: 'Course adjusted', timestamp: '10:42:30' },
    { id: '6', type: 'system', message: 'New waypoint added', timestamp: '10:50:00' }
  ]);

  // Handle emergency stop
  const handleEmergencyStop = () => {
    toast({
      title: "Emergency Stop Activated",
      description: "All motors stopped. Boat in emergency mode.",
      variant: "destructive"
    });
    
    // Add to logs
    addLogEntry({
      type: 'emergency',
      message: 'Emergency Stop Activated'
    });
    
    // Update sensor status
    setSensors(prev => prev.map(sensor => 
      sensor.name.includes('Motor') 
        ? { ...sensor, status: 'offline' as const, lastUpdated: 'just now' }
        : sensor
    ));
  };
  
  // Handle reset
  const handleReset = () => {
    toast({
      title: "System Reset",
      description: "All systems restarting."
    });
    
    // Add to logs
    addLogEntry({
      type: 'system',
      message: 'System reset initiated'
    });
    
    // Simulate system coming back online
    setTimeout(() => {
      setSensors(prev => prev.map(sensor => ({ 
        ...sensor, 
        status: 'online' as const, 
        lastUpdated: 'just now' 
      })));
      
      addLogEntry({
        type: 'system',
        message: 'System reset complete'
      });
    }, 2000);
  };
  
  // Add waypoint
  const handleAddWaypoint = (waypoint: { name: string; lat: number; lng: number }) => {
    console.log("Adding waypoint:", waypoint);
    
    const newWaypoint = {
      id: waypoints.length + 1,
      ...waypoint
    };
    
    setWaypoints(prev => [...prev, newWaypoint]);
    
    toast({
      title: "Waypoint Added",
      description: `${waypoint.name} (${waypoint.lat.toFixed(4)}, ${waypoint.lng.toFixed(4)})`
    });
    
    addLogEntry({
      type: 'system',
      message: `Waypoint added: ${waypoint.name}`
    });
  };
  
  // Helper to add log entries
  const addLogEntry = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timestamp = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    setLogs(prev => [
      {
        id: Date.now().toString(),
        timestamp,
        ...entry
      },
      ...prev
    ]);
  };
  
  // Simulate random battery drain
  useEffect(() => {
    const interval = setInterval(() => {
      setBatteryLevel(prev => {
        const newLevel = prev - Math.random() * 0.5;
        return newLevel < 10 ? 92 : newLevel;
      });
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-screen-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Aqua Navigator Control Hub</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map Section - Left column on large screens, full width on small */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main Map */}
            <div className="h-[500px]">
              <BoatMap onAddWaypoint={(lat, lng) => handleAddWaypoint({ 
                name: `Waypoint ${(waypoints.length % 10) + 1}`, 
                lat, 
                lng 
              })} />
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
            <StatusPanel batteryPercentage={Math.round(batteryLevel)} signalStrength={signalStrength} />
            
            {/* Camera Feed */}
            <CameraFeed cameras={cameras} defaultCamera="main" />
            
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
