
import React, { useState, useEffect, useRef } from 'react';
import { Camera, ChevronDown, RefreshCw, Zap } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

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
  const processingIntervalRef = useRef<number | null>(null);

  // Load OpenCV
  useEffect(() => {
    // Check if OpenCV is already loaded
    if (window.cv) {
      setOpenCVLoaded(true);
      return;
    }

    // Create script tag to load OpenCV
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.5.5/opencv.js';
    script.async = true;
    script.onload = () => {
      console.log('OpenCV.js loaded successfully');
      setOpenCVLoaded(true);
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

    // Cleanup
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Function to get available cameras
  const getAvailableCameras = async () => {
    try {
      setLoading(true);
      // Check if media devices are supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        toast({
          title: "Camera Error",
          description: "Media devices not supported in this browser",
          variant: "destructive"
        });
        return;
      }

      // Get all media devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Filter for video inputs (cameras)
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        toast({
          title: "No Cameras Found",
          description: "No video input devices detected"
        });
        return;
      }
      
      // Format camera devices for our component
      const cameraOptions: CameraOption[] = videoDevices.map(device => ({
        id: device.deviceId,
        name: device.label || `Camera ${device.deviceId.slice(0, 5)}...`
      }));
      
      setCameras(cameraOptions);
      
      // Select first camera if none selected
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

  // Process frame with OpenCV
  const processFrame = () => {
    if (!window.cv || !videoRef.current || !canvasRef.current || !streaming) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      // Get image data from canvas
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Create OpenCV matrix from image data
      const src = window.cv.matFromImageData(imageData);
      const dst = new window.cv.Mat();
      
      // Apply some OpenCV processing (grayscale conversion and edge detection)
      window.cv.cvtColor(src, src, window.cv.COLOR_RGBA2GRAY);
      window.cv.Canny(src, dst, 50, 150, 3, false);
      
      // Convert back to RGBA for display
      window.cv.cvtColor(dst, dst, window.cv.COLOR_GRAY2RGBA);
      
      // Put the processed image back on the canvas
      window.cv.imshow(canvas, dst);
      
      // Clean up OpenCV matrices to prevent memory leaks
      src.delete();
      dst.delete();
    } catch (error) {
      console.error('Error processing frame with OpenCV:', error);
      // If error occurs, just display the unprocessed video frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
  };

  // Function to start streaming from selected camera
  const startCamera = async () => {
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Stop any existing processing
    if (processingIntervalRef.current) {
      window.clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
    
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
      
      // Request access to the selected camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: selectedCamera }
        }
      });
      
      // Store the stream for cleanup
      streamRef.current = stream;
      
      // Set the stream as the video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
      }
      
      // Start processing frames if enabled
      if (processingEnabled && openCVLoaded) {
        processingIntervalRef.current = window.setInterval(processFrame, 30); // ~30fps
      }
      
      toast({
        title: "Camera Active",
        description: `Connected to ${cameras.find(c => c.id === selectedCamera)?.name}`
      });
    } catch (error) {
      console.error("Error starting camera:", error);
      toast({
        title: "Camera Error",
        description: "Failed to start camera stream",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle OpenCV processing
  const toggleProcessing = () => {
    const newProcessingState = !processingEnabled;
    setProcessingEnabled(newProcessingState);
    
    if (newProcessingState && streaming && openCVLoaded) {
      // Start processing if it's being enabled
      if (processingIntervalRef.current) {
        window.clearInterval(processingIntervalRef.current);
      }
      processingIntervalRef.current = window.setInterval(processFrame, 30);
      toast({
        title: "OpenCV Processing Enabled",
        description: "Real-time video processing is now active"
      });
    } else {
      // Stop processing if it's being disabled
      if (processingIntervalRef.current) {
        window.clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
      
      // Clear canvas and show raw video
      if (streaming && videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        }
      }
      
      if (newProcessingState === false) {
        toast({
          title: "OpenCV Processing Disabled",
          description: "Showing raw camera feed"
        });
      }
    }
  };

  // Initialize camera list and start default camera on component mount
  useEffect(() => {
    getAvailableCameras();
    
    // Cleanup function to stop the stream when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (processingIntervalRef.current) {
        window.clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
    };
  }, []);

  // Start the camera whenever the selected camera changes
  useEffect(() => {
    if (selectedCamera) {
      startCamera();
    }
  }, [selectedCamera]);

  // Restart processing when OpenCV loads
  useEffect(() => {
    if (openCVLoaded && processingEnabled && streaming) {
      if (processingIntervalRef.current) {
        window.clearInterval(processingIntervalRef.current);
      }
      processingIntervalRef.current = window.setInterval(processFrame, 30);
    }
  }, [openCVLoaded, processingEnabled, streaming]);

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
        
        <div className="flex items-center gap-2">
          <Button
            variant={processingEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleProcessing}
            disabled={!openCVLoaded || !streaming}
            className="flex items-center gap-1"
          >
            <Zap size={14} className={processingEnabled ? "text-yellow-300" : ""} />
            <span className="text-xs">OpenCV</span>
          </Button>
          
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
        
        {/* Hidden video element (used as source for processing) */}
        <video 
          ref={videoRef}
          className="hidden"
          autoPlay 
          playsInline
          muted
        />
        
        {/* Canvas for displaying processed frames */}
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
