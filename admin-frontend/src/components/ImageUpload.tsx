import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved: () => void;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiService.post<{
        imageUrl: string;
        filename: string;
        originalName: string;
        size: number;
      }>('/upload/equipment-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.success && response.data) {
        onImageUploaded(response.data.imageUrl);
        toast.success('Image uploaded successfully');
      } else {
        throw new Error(response.error || 'Failed to upload image');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload image';
      toast.error(errorMessage);
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageRemoved();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">Equipment Image</label>
      
      <div className="flex items-start space-x-4">
        {/* Image Preview */}
        <div className="flex-shrink-0">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl.startsWith('/uploads') ? `http://localhost:3001${previewUrl}` : previewUrl}
                alt="Equipment preview"
                className="w-32 h-32 object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <i className="ri-close-line text-sm"></i>
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <i className="ri-image-line text-2xl text-gray-400 mb-2"></i>
                <p className="text-xs text-gray-500">No image</p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <i className="ri-upload-line mr-2"></i>
                  {previewUrl ? 'Change Image' : 'Upload Image'}
                </>
              )}
            </button>
            
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ml-2"
              >
                <i className="ri-delete-bin-line mr-2"></i>
                Remove
              </button>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
