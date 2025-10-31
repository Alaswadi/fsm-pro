import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fileUploadService, FileUploadOptions } from '../services/fileUpload';

interface ImagePickerButtonProps {
  onImageSelected?: (imageUrl: string) => void;
  onError?: (error: string) => void;
  uploadType?: 'equipment-image' | 'job-attachment';
  options?: FileUploadOptions;
  style?: any;
  buttonText?: string;
  showPreview?: boolean;
  currentImageUrl?: string;
}

export const ImagePickerButton: React.FC<ImagePickerButtonProps> = ({
  onImageSelected,
  onError,
  uploadType = 'job-attachment',
  options = {},
  style,
  buttonText = 'Add Photo',
  showPreview = true,
  currentImageUrl,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(currentImageUrl || null);

  const handleImagePick = async () => {
    try {
      setIsUploading(true);
      
      const result = await fileUploadService.pickAndUploadImage(uploadType, options);
      
      if (result.success && result.url) {
        setSelectedImageUri(result.url);
        onImageSelected?.(result.url);
      } else {
        const errorMessage = result.error || 'Failed to upload image';
        Alert.alert('Upload Error', errorMessage);
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred';
      Alert.alert('Error', errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSelectedImageUri(null);
            onImageSelected?.('');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      {selectedImageUri && showPreview ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
          <View style={styles.imageActions}>
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={handleImagePick}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="camera" size={16} color="white" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={handleRemoveImage}
              disabled={isUploading}
            >
              <Ionicons name="trash" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleImagePick}
          disabled={isUploading}
        >
          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color="#ea2a33" />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          ) : (
            <View style={styles.uploadContent}>
              <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
              <Text style={styles.uploadText}>{buttonText}</Text>
              <Text style={styles.uploadSubtext}>Tap to take photo or select from gallery</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    minHeight: 120,
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  uploadingContainer: {
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 14,
    color: '#ea2a33',
    marginTop: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  changeImageButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ImagePickerButton;
