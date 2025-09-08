import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { apiService } from './api';

export interface FileUploadOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

export interface FileUploadResult {
  success: boolean;
  uri?: string;
  fileName?: string;
  error?: string;
}

class FileUploadService {
  
  // Request camera permissions
  async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to take photos for work orders.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  // Request media library permissions
  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Media Library Permission Required',
          'Please grant media library permission to select photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  }

  // Take a photo with camera
  async takePhoto(options: FileUploadOptions = {}): Promise<FileUploadResult> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        return { success: false, error: 'Camera permission denied' };
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [4, 3],
        quality: options.quality ?? 0.8,
      });

      if (result.canceled) {
        return { success: false, error: 'User cancelled photo capture' };
      }

      const asset = result.assets[0];
      return {
        success: true,
        uri: asset.uri,
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
      };
    } catch (error) {
      console.error('Error taking photo:', error);
      return { success: false, error: 'Failed to take photo' };
    }
  }

  // Pick image from gallery
  async pickImage(options: FileUploadOptions = {}): Promise<FileUploadResult> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        return { success: false, error: 'Media library permission denied' };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [4, 3],
        quality: options.quality ?? 0.8,
      });

      if (result.canceled) {
        return { success: false, error: 'User cancelled image selection' };
      }

      const asset = result.assets[0];
      return {
        success: true,
        uri: asset.uri,
        fileName: asset.fileName || `image_${Date.now()}.jpg`,
      };
    } catch (error) {
      console.error('Error picking image:', error);
      return { success: false, error: 'Failed to pick image' };
    }
  }

  // Show image picker options
  async showImagePickerOptions(options: FileUploadOptions = {}): Promise<FileUploadResult> {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Image',
        'Choose how you want to add an image',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const result = await this.takePhoto(options);
              resolve(result);
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const result = await this.pickImage(options);
              resolve(result);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve({ success: false, error: 'User cancelled' }),
          },
        ]
      );
    });
  }

  // Upload file to server
  async uploadFile(
    uri: string, 
    type: 'equipment-image' | 'job-attachment' = 'job-attachment'
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const response = await apiService.uploadFile(uri, type);
      
      if (response.success && response.data) {
        return {
          success: true,
          url: response.data.url,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Upload failed',
        };
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: 'Failed to upload file',
      };
    }
  }

  // Complete flow: pick/take image and upload
  async pickAndUploadImage(
    type: 'equipment-image' | 'job-attachment' = 'job-attachment',
    options: FileUploadOptions = {}
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // First, get the image
      const imageResult = await this.showImagePickerOptions(options);
      
      if (!imageResult.success || !imageResult.uri) {
        return {
          success: false,
          error: imageResult.error || 'No image selected',
        };
      }

      // Then upload it
      const uploadResult = await this.uploadFile(imageResult.uri, type);
      
      return uploadResult;
    } catch (error) {
      console.error('Error in pick and upload flow:', error);
      return {
        success: false,
        error: 'Failed to process image',
      };
    }
  }

  // Utility to validate image file
  isValidImageFile(fileName: string): boolean {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return validExtensions.includes(extension);
  }

  // Get file size in MB
  async getFileSize(uri: string): Promise<number> {
    try {
      // This is a simplified version - in a real app you might want to use
      // a library like react-native-fs to get actual file size
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size / (1024 * 1024); // Convert to MB
    } catch (error) {
      console.error('Error getting file size:', error);
      return 0;
    }
  }

  // Validate file size (max 10MB by default)
  async validateFileSize(uri: string, maxSizeMB: number = 10): Promise<boolean> {
    const fileSizeMB = await this.getFileSize(uri);
    return fileSizeMB <= maxSizeMB;
  }
}

export const fileUploadService = new FileUploadService();
export default fileUploadService;
