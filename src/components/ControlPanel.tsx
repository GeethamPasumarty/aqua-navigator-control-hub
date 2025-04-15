
import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ControlPanelProps {
  onEmergencyStop: () => void;
  onReset: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onEmergencyStop, 
  onReset 
}) => {
  const [isAutonomous, setIsAutonomous] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-marine-border p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Control Mode</h3>
          <div className="flex items-center space-x-1">
            <span className={`text-xs ${!isAutonomous ? 'font-bold text-marine-blue-dark' : 'text-gray-500'}`}>
              Manual
            </span>
            <Switch 
              checked={isAutonomous} 
              onCheckedChange={setIsAutonomous}
              className="data-[state=checked]:bg-marine-blue-dark" 
            />
            <span className={`text-xs ${isAutonomous ? 'font-bold text-marine-blue-dark' : 'text-gray-500'}`}>
              Autonomous
            </span>
          </div>
        </div>
        
        <div className="text-xs bg-gray-50 p-2 rounded">
          {isAutonomous ? (
            <p>The boat is in autonomous mode and will follow the defined waypoints.</p>
          ) : (
            <p>Manual control mode. Use the controls to navigate the boat.</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={onEmergencyStop}
          className="bg-marine-red hover:bg-marine-red/90 text-white flex items-center justify-center h-12"
        >
          <AlertCircle className="mr-2" size={18} />
          EMERGENCY STOP
        </Button>
        
        <Button 
          onClick={onReset}
          variant="outline"
          className="border-gray-300 hover:bg-gray-50 text-gray-700 flex items-center justify-center h-12"
        >
          <RefreshCw className="mr-2" size={18} />
          RESET
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;
