import React, { useState, useRef, useEffect } from 'react';
import { HiCamera, HiX, HiVideoCamera, HiRefresh, HiCheck, HiUpload } from 'react-icons/hi';

interface PhotoUploadProps {
  file: File | null;
  preview: string | null;
  onChange: (file: File, preview: string) => void;
  onRemove: () => void;
  label?: string;
  error?: string;
}

type WebcamState = 'idle' | 'initializing' | 'ready' | 'captured' | 'error';

const PhotoUpload: React.FC<PhotoUploadProps> = ({ preview, onChange, onRemove, label = 'Photo', error }) => {
  const [webcamState, setWebcamState] = useState<WebcamState>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup webcam stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Initialize webcam
  const initializeWebcam = async () => {
    setWebcamState('initializing');
    setCameraError('');

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment'  // Always back camera
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setWebcamState('ready');
        };
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Failed to access camera';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera access is not supported in this browser.';
      }
      
      setCameraError(errorMessage);
      setWebcamState('error');
    }
  };

  // Stop webcam
  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setWebcamState('idle');
    setCapturedPhoto(null);
    setCameraError('');
  };

  // Capture photo from webcam
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const photoUrl = URL.createObjectURL(blob);
        setCapturedPhoto(photoUrl);
        setWebcamState('captured');
      }
    }, 'image/jpeg', 0.8);
  };

  // Retake photo
  const retakePhoto = () => {
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto);
      setCapturedPhoto(null);
    }
    setWebcamState('ready');
  };

  // Use captured photo
  const useCapturedPhoto = () => {
    if (!capturedPhoto || !canvasRef.current) return;

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) {
        throw new Error('Failed to process captured photo');
      }

      // Create file from blob
      const file = new File([blob], 'webcam-photo.jpg', { type: 'image/jpeg' });
      
      // Generate preview URL from file
      const previewUrl = URL.createObjectURL(file);

      // Pass file and preview to parent
      onChange(file, previewUrl);

      // Cleanup
      URL.revokeObjectURL(capturedPhoto);
      setCapturedPhoto(null);
      stopWebcam();
    }, 'image/jpeg', 0.8);
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      alert('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      onChange(selectedFile, previewUrl);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Photo Preview */}
      <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative mx-auto sm:mx-0">
          <div className="w-32 h-32 sm:w-32 sm:h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
            {preview ? (
              <img
                src={preview}
                alt={`${label} preview`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <HiCamera className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                <p className="text-xs text-gray-500 mt-1">No photo</p>
              </div>
            )}
          </div>
          
          {preview && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <HiX className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          )}
        </div>

        {/* Photo Controls */}
        <div className="flex-1 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
            <button
              type="button"
              onClick={handleFileClick}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <HiUpload className="h-4 w-4 mr-2" />
              Select Photo
            </button>
            
            <button
              type="button"
              onClick={initializeWebcam}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <HiVideoCamera className="h-4 w-4 mr-2" />
              Take Photo
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center sm:text-left">
            Choose a photo from your device or use your camera
          </p>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Webcam Mode */}
      {webcamState !== 'idle' && (
        <div className="space-y-4">
          {/* Camera Error */}
          {webcamState === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <HiX className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Camera Error</h3>
                  <p className="text-sm text-red-700 mt-1">{cameraError}</p>
                  <button
                    type="button"
                    onClick={initializeWebcam}
                    className="mt-2 text-sm text-red-800 underline hover:text-red-900"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Camera Initializing */}
          {webcamState === 'initializing' && (
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Initializing camera...</p>
              </div>
            </div>
          )}

          {/* Camera Ready */}
          {webcamState === 'ready' && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                />
                
                {/* Camera Controls Overlay */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="bg-white text-gray-900 p-3 rounded-full hover:bg-gray-100 transition-all shadow-lg"
                    title="Capture Photo"
                  >
                    <HiCamera className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Photo Captured */}
          {webcamState === 'captured' && capturedPhoto && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={capturedPhoto}
                  alt="Captured photo"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={retakePhoto}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <HiRefresh className="h-4 w-4 mr-2" />
                  Retake
                </button>
                
                <button
                  type="button"
                  onClick={useCapturedPhoto}
                  className="inline-flex items-center px-4 py-2 border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <HiCheck className="h-4 w-4 mr-2" />
                  Use Photo
                </button>
              </div>
            </div>
          )}

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default PhotoUpload;
