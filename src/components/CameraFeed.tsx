
import React, { useState, useEffect, useRef } from 'react';
import { Camera, ChevronDown, RefreshCw, Zap } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

// Import OpenCV.js
declare global {
  interface Window {
    cv: any;
  }
}

interface CameraOption {
  id: string;
  name: string;
}

interface CameraFeedProps {
  cameras: CameraOption[];
  defaultCamera?: string;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ 
  cameras: initialCameras, 
  defaultCamera
}) => {
  const { toast } = useToast();
  const [cameras, setCameras] = useState<CameraOption[]>(initialCameras);
  const [selectedCamera, setSelectedCamera] = useState(defaultCamera || '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingEnabled, setProcessingEnabled] = useState(false);
  const [openCVLoaded, setOpenCVLoaded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const openCVRef = useRef<boolean>(false);

  // Load OpenCV
  useEffect(() => {
    if (window.cv) {
      console.log("OpenCV is already available in window object");
      setOpenCVLoaded(true);
      openCVRef.current = true;
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.5.5/opencv.js';
    script.async = true;
    script.onload = () => {
      console.log('OpenCV.js loaded successfully');
      setOpenCVLoaded(true);
      openCVRef.current = true;
      toast({
        title: "OpenCV Ready",
        description: "OpenCV.js has been loaded successfully"
      });
    };
    script.onerror = () => {
      console.error('Failed to load OpenCV.js');
      toast({
        title: "OpenCV Error",
        description: "Failed to load OpenCV.js",
        variant: "destructive"
      });
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Cleanup function to properly stop camera stream and processing
  const cleanupCamera = () => {
    console.log("Cleaning up camera and stopping streams");
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        console.log(`Stopping track: ${track.kind} (${track.id})`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
    
    setStreaming(false);
  };

  // Function to get available cameras
  const getAvailableCameras = async () => {
    try {
      cleanupCamera();
      
      setLoading(true);
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        toast({
          title: "Camera Error",
          description: "Media devices not supported in this browser",
          variant: "destructive"
        });
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        toast({
          title: "No Cameras Found",
          description: "No video input devices detected"
        });
        return;
      }
      
      const cameraOptions: CameraOption[] = videoDevices.map(device => ({
        id: device.deviceId,
        name: device.label || `Camera ${device.deviceId.slice(0, 5)}...`
      }));
      
      setCameras(cameraOptions);
      
      if (!selectedCamera && cameraOptions.length > 0) {
        setSelectedCamera(cameraOptions[0].id);
      }
    } catch (error) {
      console.error("Error accessing camera devices:", error);
      toast({
        title: "Camera Error",
        description: "Failed to access camera devices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Process frame using requestAnimationFrame
  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current || !streaming) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      if (processingEnabled && window.cv && openCVRef.current) {
        // Process with OpenCV
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const src = window.cv.matFromImageData(imageData);
        const dst = new window.cv.Mat();
        
        window.cv.cvtColor(src, src, window.cv.COLOR_RGBA2GRAY);
        window.cv.Canny(src, dst, 50, 150, 3, false);
        window.cv.cvtColor(dst, dst, window.cv.COLOR_GRAY2RGBA);
        
        window.cv.imshow(canvas, dst);
        
        src.delete();
        dst.delete();
        
        console.log("OpenCV processing applied");
      } else {
        // Draw raw camera feed
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      
      // Request next frame
      animationFrameRef.current = requestAnimationFrame(processFrame);
    } catch (error) {
      console.error('Error processing frame:', error);
      // Fallback to raw video
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  };

  // Function to start streaming from selected camera
  const startCamera = async () => {
    cleanupCamera();
    
    if (!selectedCamera) {
      toast({
        title: "Camera Error",
        description: "No camera selected",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const constraints = {
        video: selectedCamera === 'default' 
          ? true 
          : { deviceId: { exact: selectedCamera }, width: { ideal: 1280 }, height: { ideal: 720 } }
      };
      
      console.log(`Requesting camera with constraints:`, constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log(`Camera stream obtained with ${stream.getTracks().length} tracks`);
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setStreaming(true);
                animationFrameRef.current = requestAnimationFrame(processFrame);
                
                toast({
                  title: "Camera Active",
                  description: `Connected to ${cameras.find(c => c.id === selectedCamera)?.name || 'camera'}`
                });
              })
              .catch(err => {
                console.error("Error playing video:", err);
                toast({
                  title: "Camera Error",
                  description: "Failed to play video stream",
                  variant: "destructive"
                });
              });
          }
        };
      }
    } catch (error) {
      console.error("Error starting camera:", error);
      toast({
        title: "Camera Error",
        description: "Failed to start camera stream. Try a different camera or browser.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle OpenCV processing
  const toggleProcessing = () => {
    if (!openCVLoaded || !window.cv) {
      toast({
        title: "OpenCV Not Ready",
        description: "OpenCV.js hasn't loaded yet. Please wait and try again.",
        variant: "destructive"
      });
      return;
    }
    
    setProcessingEnabled(prevState => !prevState);
  };

  // Handle dropdown camera selection
  const handleCameraSelect = (cameraId: string) => {
    console.log(`Switching camera to: ${cameraId}`);
    cleanupCamera();
    setSelectedCamera(cameraId);
    setDropdownOpen(false);
  };

  // Initialize camera list and start default camera on component mount
  useEffect(() => {
    getAvailableCameras();
    
    return () => {
      cleanupCamera();
    };
  }, []);

  // Start the camera whenever the selected camera changes
  useEffect(() => {
    if (selectedCamera) {
      startCamera();
    }
  }, [selectedCamera]);

  const selectedCameraName = cameras.find(c => c.id === selectedCamera)?.name || 'Select Camera';

  return (
    <div className="bg-white rounded-lg border border-marine-border overflow-hidden">
      <div className="p-2 border-b border-marine-border flex justify-between items-center">
        <div className="relative flex-1">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full px-3 py-1.5 text-sm bg-gray-50 rounded hover:bg-gray-100"
            disabled={loading}
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
                  onClick={() => handleCameraSelect(camera.id)}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                    camera.id === selectedCamera ? 'bg-marine-blue bg-opacity-10' : ''
                  }`}
                >
                  {camera.name}
                </button>
              ))}
              <button
                onClick={() => handleCameraSelect('default')}
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                  selectedCamera === 'default' ? 'bg-marine-blue bg-opacity-10' : ''
                }`}
              >
                Default Camera
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">OpenCV</span>
            <Switch
              checked={processingEnabled}
              onCheckedChange={toggleProcessing}
              disabled={!openCVLoaded || !streaming}
            />
          </div>
          
          <button 
            onClick={getAvailableCameras}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
            disabled={loading}
            title="Refresh camera list"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
      
      <div className="aspect-video bg-gray-800 relative overflow-hidden">
        {!streaming && !loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <Camera size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-70">Camera not connected</p>
              <button
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-marine-blue rounded text-white text-sm"
              >
                Connect
              </button>
            </div>
          </div>
        ) : null}
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
        
        {/* Hidden video element */}
        <video 
          ref={videoRef}
          className="hidden"
          autoPlay 
          playsInline
          muted
        />
        
        {/* Canvas for displaying frames */}
        <canvas 
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover ${!streaming ? 'opacity-0' : ''}`}
        />
        
        {streaming && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            {processingEnabled ? 'OpenCV Active' : 'Live'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraFeed;
