import React, { useState, useRef } from 'react';
import { HiCamera, HiX, HiUpload } from 'react-icons/hi';

interface PhotoUploadProps {
  photoUrl: string;
  onChange: (photoUrl: string) => void;
  error?: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ photoUrl, onChange, error }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(photoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('http://localhost:7000/api/photos/upload-staff-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      if (result.success) {
        onChange(result.data.photoUrl);
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photo. Please try again.');
      setPreviewUrl(photoUrl); // Reset preview on error
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Staff Photo
      </label>
      
      <div className="flex items-start space-x-4">
        {/* Photo Preview */}
        <div className="relative">
          <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl.startsWith('http') ? previewUrl : `http://localhost:7000/${previewUrl}`}
                alt="Staff photo preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <HiCamera className="mx-auto h-8 w-8 text-gray-400" />
                <p className="text-xs text-gray-500 mt-1">No photo</p>
              </div>
            )}
          </div>
          
          {previewUrl && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <HiX className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <HiUpload className="h-4 w-4 mr-2" />
                {previewUrl ? 'Change Photo' : 'Upload Photo'}
              </>
            )}
          </button>
          
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: JPEG, PNG, WebP<br />
            Maximum size: 5MB
          </p>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default PhotoUpload;
