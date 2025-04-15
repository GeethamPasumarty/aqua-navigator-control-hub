
import React, { useState } from 'react';
import { Camera, ChevronDown } from 'lucide-react';

interface CameraOption {
  id: string;
  name: string;
}

interface CameraFeedProps {
  cameras: CameraOption[];
  defaultCamera?: string;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ 
  cameras, 
  defaultCamera = cameras[0]?.id 
}) => {
  const [selectedCamera, setSelectedCamera] = useState(defaultCamera);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedCameraName = cameras.find(c => c.id === selectedCamera)?.name || 'Camera';

  return (
    <div className="bg-white rounded-lg border border-marine-border overflow-hidden">
      <div className="p-2 border-b border-marine-border">
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full px-3 py-1.5 text-sm bg-gray-50 rounded hover:bg-gray-100"
          >
            <div className="flex items-center">
              <Camera size={16} className="mr-2 text-gray-500" />
              <span>{selectedCameraName}</span>
            </div>
            <ChevronDown size={16} className="text-gray-500" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-md z-10">
              {cameras.map(camera => (
                <button
                  key={camera.id}
                  onClick={() => {
                    setSelectedCamera(camera.id);
                    setDropdownOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                    camera.id === selectedCamera ? 'bg-marine-blue bg-opacity-10' : ''
                  }`}
                >
                  {camera.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="aspect-video bg-gray-800 relative overflow-hidden">
        <img 
          src="/lovable-uploads/38516093-95b5-4a13-b853-c857ee42a302.png" 
          alt="Camera Feed" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Live
        </div>
      </div>
    </div>
  );
};

export default CameraFeed;
