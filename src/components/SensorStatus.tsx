
import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface Sensor {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  lastUpdated: string;
}

interface SensorStatusProps {
  sensors: Sensor[];
}

const SensorStatus: React.FC<SensorStatusProps> = ({ sensors }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle size={16} className="text-marine-green-dark" />;
      case 'offline':
        return <XCircle size={16} className="text-marine-red" />;
      case 'warning':
        return <CheckCircle size={16} className="text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-marine-border p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Sensor Status</h3>
      <div className="space-y-2">
        {sensors.map((sensor) => (
          <div key={sensor.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center">
              {getStatusIcon(sensor.status)}
              <span className="ml-2 text-sm">{sensor.name}</span>
            </div>
            <div className="text-xs text-gray-500">{sensor.lastUpdated}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SensorStatus;
