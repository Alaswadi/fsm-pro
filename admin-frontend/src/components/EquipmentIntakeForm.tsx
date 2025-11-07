import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { intakeService } from '../services/intakeService';
import type { EquipmentIntake, IntakePhoto } from '../types/workshop';

interface EquipmentIntakeFormProps {
  jobId: string;
  existingIntake?: EquipmentIntake;
  onSuccess: (intake: EquipmentIntake) => void;
  onCancel: () => void;
}

interface PhotoPreview {
  file: File;
  preview: string;
  type: string;
}

const EquipmentIntakeForm: React.FC<EquipmentIntakeFormProps> = ({
  jobId,
  existingIntake,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    reported_issue: existingIntake?.reported_issue || '',
    visual_condition: existingIntake?.visual_condition || '',
    physical_damage_notes: existingIntake?.physical_damage_notes || '',
    accessories_included: existingIntake?.accessories_included || '',
    customer_notes: existingIntake?.customer_notes || '',
    internal_notes: existingIntake?.internal_notes || '',
    estimated_repair_time: existingIntake?.estimated_repair_time || 24,
  });

  // Photo state
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [existingPhotos] = useState<IntakePhoto[]>(existingIntake?.photos || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate estimated completion date
  const calculateEstimatedCompletion = (hours: number): string => {
    const now = new Date();
    now.setHours(now.getHours() + hours);
    return now.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Signature canvas setup
  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set drawing style
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature if available
    if (existingIntake?.customer_signature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasSignature(true);
      };
      img.src = existingIntake.customer_signature;
    }
  }, [existingIntake]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const getSignatureDataUrl = (): string | null => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !hasSignature) return null;
    return canvas.toDataURL('image/png');
  };

  // Photo handling
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid file type`);
        return false;
      }
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error(`${file.name}: File too large (max 5MB)`);
        return false;
      }
      
      return true;
    });

    // Create previews
    const newPhotos: PhotoPreview[] = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: 'overall',
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const updatePhotoType = (index: number, type: string) => {
    setPhotos(prev => {
      const updated = [...prev];
      updated[index].type = type;
      return updated;
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimated_repair_time' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.reported_issue.trim()) {
      toast.error('Please enter the reported issue');
      return;
    }

    if (!hasSignature && !existingIntake) {
      toast.error('Customer signature is required');
      return;
    }

    try {
      setLoading(true);

      const signature = getSignatureDataUrl();
      const intakeData = {
        job_id: jobId,
        ...formData,
        customer_signature: signature || existingIntake?.customer_signature,
      };

      let intake: EquipmentIntake;

      if (existingIntake) {
        // Update existing intake
        const response = await intakeService.updateIntake(existingIntake.id, intakeData);
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to update intake');
        }
        intake = response.data;
        toast.success('Intake record updated successfully');
      } else {
        // Create new intake
        const response = await intakeService.createIntake(intakeData);
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to create intake');
        }
        intake = response.data;
        toast.success('Intake record created successfully');
      }

      // Upload photos if any
      if (photos.length > 0) {
        setUploadingPhotos(true);
        const files = photos.map(p => p.file);
        const types = photos.map(p => p.type);
        
        const photoResponse = await intakeService.uploadIntakePhotos(intake.id, files, types);
        if (!photoResponse.success) {
          toast.error('Failed to upload some photos');
        } else {
          toast.success('Photos uploaded successfully');
        }
        setUploadingPhotos(false);
      }

      onSuccess(intake);
    } catch (error: any) {
      console.error('Error saving intake:', error);
      toast.error(error.message || 'Failed to save intake record');
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Reported Issue */}
      <div>
        <label htmlFor="reported_issue" className="block text-sm font-medium text-gray-700 mb-1">
          Reported Issue <span className="text-red-500">*</span>
        </label>
        <textarea
          id="reported_issue"
          name="reported_issue"
          value={formData.reported_issue}
          onChange={handleInputChange}
          rows={3}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe the issue reported by the customer..."
        />
      </div>

      {/* Visual Condition */}
      <div>
        <label htmlFor="visual_condition" className="block text-sm font-medium text-gray-700 mb-1">
          Visual Condition
        </label>
        <textarea
          id="visual_condition"
          name="visual_condition"
          value={formData.visual_condition}
          onChange={handleInputChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Overall visual condition of the equipment..."
        />
      </div>

      {/* Physical Damage Notes */}
      <div>
        <label htmlFor="physical_damage_notes" className="block text-sm font-medium text-gray-700 mb-1">
          Physical Damage Notes
        </label>
        <textarea
          id="physical_damage_notes"
          name="physical_damage_notes"
          value={formData.physical_damage_notes}
          onChange={handleInputChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Any visible damage, scratches, dents, etc..."
        />
      </div>

      {/* Accessories Included */}
      <div>
        <label htmlFor="accessories_included" className="block text-sm font-medium text-gray-700 mb-1">
          Accessories Included
        </label>
        <input
          type="text"
          id="accessories_included"
          name="accessories_included"
          value={formData.accessories_included}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Power cable, manual, carrying case"
        />
      </div>

      {/* Customer Notes */}
      <div>
        <label htmlFor="customer_notes" className="block text-sm font-medium text-gray-700 mb-1">
          Customer Notes
        </label>
        <textarea
          id="customer_notes"
          name="customer_notes"
          value={formData.customer_notes}
          onChange={handleInputChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Any additional notes from the customer..."
        />
      </div>

      {/* Internal Notes */}
      <div>
        <label htmlFor="internal_notes" className="block text-sm font-medium text-gray-700 mb-1">
          Internal Notes
        </label>
        <textarea
          id="internal_notes"
          name="internal_notes"
          value={formData.internal_notes}
          onChange={handleInputChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Internal notes (not visible to customer)..."
        />
      </div>

      {/* Estimated Repair Time */}
      <div>
        <label htmlFor="estimated_repair_time" className="block text-sm font-medium text-gray-700 mb-1">
          Estimated Repair Time (hours)
        </label>
        <input
          type="number"
          id="estimated_repair_time"
          name="estimated_repair_time"
          value={formData.estimated_repair_time}
          onChange={handleInputChange}
          min="1"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-1">
          Estimated completion: {calculateEstimatedCompletion(formData.estimated_repair_time)}
        </p>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Equipment Photos
        </label>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoSelect}
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <i className="ri-camera-line mr-2"></i>
          Add Photos
        </button>

        {/* Photo Previews */}
        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={photo.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  <i className="ri-close-line text-sm"></i>
                </button>
                <select
                  value={photo.type}
                  onChange={(e) => updatePhotoType(index, e.target.value)}
                  className="mt-2 w-full text-xs px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="overall">Overall</option>
                  <option value="damage">Damage</option>
                  <option value="serial_number">Serial Number</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Existing Photos */}
        {existingPhotos.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Existing Photos:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {existingPhotos.map((photo) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || 'Equipment photo'}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <span className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    {photo.photo_type || 'overall'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Customer Signature */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer Signature <span className="text-red-500">*</span>
        </label>
        <div className="border-2 border-gray-300 rounded-lg p-2 bg-white">
          <canvas
            ref={signatureCanvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-40 border border-gray-200 rounded cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">Sign above</p>
            <button
              type="button"
              onClick={clearSignature}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear Signature
            </button>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading || uploadingPhotos}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploadingPhotos}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
        >
          {loading || uploadingPhotos ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {uploadingPhotos ? 'Uploading Photos...' : 'Saving...'}
            </>
          ) : (
            <>
              <i className="ri-save-line mr-2"></i>
              {existingIntake ? 'Update Intake' : 'Create Intake'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default EquipmentIntakeForm;
