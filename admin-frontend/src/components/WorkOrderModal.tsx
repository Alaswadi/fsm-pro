import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { Job, JobOptions, CustomerEquipmentForJob, JobPriority, JobStatus } from '../types';
import SearchableSelect from './SearchableSelect';

interface WorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingJob: Job | null;
}

interface FormData {
  customer_id: string;
  equipment_id: string;
  technician_id: string;
  title: string;
  description: string;
  priority: JobPriority;
  status: JobStatus;
  scheduled_date: string;
  due_date: string;
  estimated_duration: string;
}

interface SearchOption {
  value: string;
  label: string;
  subtitle?: string;
}

const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingJob
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [options, setOptions] = useState<JobOptions | null>(null);

  const [formData, setFormData] = useState<FormData>({
    customer_id: '',
    equipment_id: '',
    technician_id: '',
    title: '',
    description: '',
    priority: 'medium',
    status: 'assigned', // Default to assigned since technician is mandatory
    scheduled_date: '',
    due_date: '',
    estimated_duration: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      if (editingJob) {
        setFormData({
          customer_id: editingJob.customer_id || '',
          equipment_id: editingJob.equipment_id || '',
          technician_id: editingJob.technician_id || '',
          title: editingJob.title || '',
          description: editingJob.description || '',
          priority: editingJob.priority || 'medium',
          status: editingJob.status || 'assigned',
          scheduled_date: editingJob.scheduled_date ?
            new Date(editingJob.scheduled_date).toISOString().slice(0, 16) : '',
          due_date: editingJob.due_date ?
            new Date(editingJob.due_date).toISOString().slice(0, 10) : '',
          estimated_duration: editingJob.estimated_duration?.toString() || ''
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingJob]);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const response = await apiService.getJobOptions();
      
      if (response.success && response.data) {
        setOptions(response.data);
      } else {
        toast.error('Failed to load form options');
      }
    } catch (error) {
      console.error('Error loading options:', error);
      toast.error('Failed to load form options');
    } finally {
      setLoadingOptions(false);
    }
  };

  // Search functions for the searchable selects
  const searchTechnicians = async (searchTerm: string): Promise<SearchOption[]> => {
    try {
      const response = await apiService.searchTechnicians(searchTerm);
      if (response.success && response.data) {
        return response.data.map((tech: any) => ({
          value: tech.id,
          label: tech.full_name,
          subtitle: `ID: #${tech.employee_id}${!tech.is_available ? ' - Unavailable' : ''}`
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching technicians:', error);
      return [];
    }
  };

  const searchCustomers = async (searchTerm: string): Promise<SearchOption[]> => {
    try {
      const response = await apiService.searchCustomers(searchTerm);
      if (response.success && response.data) {
        return response.data.map((customer: any) => ({
          value: customer.id,
          label: customer.name,
          subtitle: customer.company_name || customer.phone
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  };

  const searchEquipment = async (searchTerm: string): Promise<SearchOption[]> => {
    try {
      const response = await apiService.searchEquipment(searchTerm, formData.customer_id || undefined);
      if (response.success && response.data) {
        return response.data.map((equipment: any) => ({
          value: equipment.id,
          label: `${equipment.brand} ${equipment.model}`,
          subtitle: `S/N: ${equipment.serial_number}${equipment.location_details ? ` - ${equipment.location_details}` : ''}`
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching equipment:', error);
      return [];
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      equipment_id: '',
      technician_id: '',
      title: '',
      description: '',
      priority: 'medium',
      status: 'assigned',
      scheduled_date: '',
      due_date: '',
      estimated_duration: ''
    });
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Reset equipment when customer changes
    if (name === 'customer_id') {
      setFormData(prev => ({ ...prev, equipment_id: '' })); // Reset equipment selection
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }
    if (!formData.technician_id) {
      newErrors.technician_id = 'Technician assignment is required';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    } else {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

      if (dueDate < today) {
        newErrors.due_date = 'Due date cannot be in the past';
      }
    }
    if (formData.estimated_duration && isNaN(Number(formData.estimated_duration))) {
      newErrors.estimated_duration = 'Estimated duration must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        equipment_id: formData.equipment_id || null,
        technician_id: formData.technician_id || null,
        scheduled_date: formData.scheduled_date || null,
        due_date: formData.due_date,
        estimated_duration: formData.estimated_duration ? Number(formData.estimated_duration) : null
      };

      let response;
      if (editingJob) {
        response = await apiService.updateJob(editingJob.id, submitData);
      } else {
        response = await apiService.createJob(submitData);
      }

      if (response.success) {
        toast.success(editingJob ? 'Work order updated successfully' : 'Work order created successfully');
        onSave();
        onClose();
      } else {
        toast.error(response.error || 'Failed to save work order');
      }
    } catch (error) {
      console.error('Error saving work order:', error);
      toast.error('Failed to save work order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {editingJob ? 'Edit Work Order' : 'Create New Work Order'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {loadingOptions ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading form options...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <SearchableSelect
                value={formData.customer_id}
                onChange={(value) => setFormData(prev => ({ ...prev, customer_id: value, equipment_id: '' }))}
                onSearch={searchCustomers}
                placeholder="Search and select a customer..."
                error={!!errors.customer_id}
                required
                noOptionsMessage="No customers found"
              />
              {errors.customer_id && (
                <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
              )}
            </div>

            {/* Equipment Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipment
              </label>
              <SearchableSelect
                key={`equipment-${formData.customer_id || 'no-customer'}`}
                value={formData.equipment_id}
                onChange={(value) => setFormData(prev => ({ ...prev, equipment_id: value }))}
                onSearch={searchEquipment}
                placeholder={formData.customer_id ? "Search and select equipment..." : "Select a customer first"}
                disabled={!formData.customer_id}
                noOptionsMessage="No equipment found"
              />
            </div>

            {/* Technician Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Technician *
              </label>
              <SearchableSelect
                value={formData.technician_id}
                onChange={(value) => setFormData(prev => ({ ...prev, technician_id: value }))}
                onSearch={searchTechnicians}
                placeholder="Search and select a technician..."
                error={!!errors.technician_id}
                required
                noOptionsMessage="No technicians found"
              />
              {errors.technician_id && (
                <p className="mt-1 text-sm text-red-600">{errors.technician_id}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter work order title"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the work to be performed"
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.due_date ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
              )}
            </div>

            {/* Priority and Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
            </div>

            {/* Scheduled Date and Duration Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  name="estimated_duration"
                  value={formData.estimated_duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 120"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.estimated_duration ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.estimated_duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.estimated_duration}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{editingJob ? 'Update Work Order' : 'Create Work Order'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default WorkOrderModal;
