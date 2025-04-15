
import React from 'react';
import { Battery, Signal, Activity, MoreHorizontal } from 'lucide-react';

type BatteryLevel = 'critical' | 'low' | 'medium' | 'high';
type SignalStatus = 'none' | 'weak' | 'good' | 'excellent';

interface StatusPanelProps {
  batteryPercentage: number;
  signalStrength: SignalStatus;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ 
  batteryPercentage, 
  signalStrength 
}) => {
  const getBatteryLevel = (): BatteryLevel => {
    if (batteryPercentage <= 10) return 'critical';
    if (batteryPercentage <= 30) return 'low';
    if (batteryPercentage <= 60) return 'medium';
    return 'high';
  };

  const getBatteryColor = () => {
    const level = getBatteryLevel();
    switch (level) {
      case 'critical': return 'text-marine-red';
      case 'low': return 'text-amber-500';
      case 'medium': return 'text-amber-300';
      case 'high': return 'text-marine-green-dark';
    }
  };

  const getSignalColor = () => {
    switch (signalStrength) {
      case 'none': return 'text-marine-red';
      case 'weak': return 'text-amber-500';
      case 'good': return 'text-amber-300';
      case 'excellent': return 'text-marine-green-dark';
    }
  };

  return (
    <div className="flex flex-row space-x-4 p-4 bg-white rounded-lg border border-marine-border">
      <div className="flex items-center">
        <Battery className={`mr-2 ${getBatteryColor()}`} />
        <div>
          <p className="text-sm font-medium text-gray-700">Battery</p>
          <p className={`text-sm font-bold ${getBatteryColor()}`}>{batteryPercentage}%</p>
        </div>
      </div>
      
      <div className="flex items-center">
        <Signal className={`mr-2 ${getSignalColor()}`} />
        <div>
          <p className="text-sm font-medium text-gray-700">Signal</p>
          <p className={`text-sm font-bold ${getSignalColor()} capitalize`}>{signalStrength}</p>
        </div>
      </div>
      
      <div className="flex items-center">
        <Activity className="mr-2 text-gray-500" />
        <div>
          <p className="text-sm font-medium text-gray-700">Status</p>
          <p className="text-sm font-bold text-marine-blue-dark">Active</p>
        </div>
      </div>
      
      <button className="ml-auto text-gray-400 hover:text-gray-600">
        <MoreHorizontal size={20} />
      </button>
    </div>
  );
};

export default StatusPanel;
