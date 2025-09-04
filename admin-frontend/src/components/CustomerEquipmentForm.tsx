import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { EquipmentType, CustomerEquipment } from '../types';

interface CustomerEquipmentFormProps {
  customerId?: string;
  initialEquipment?: CustomerEquipment[];
  onEquipmentChange: (equipment: CustomerEquipment[]) => void;
  isEditing: boolean;
}

interface EquipmentFormData {
  equipment_type_id: string;
  serial_number: string;
  asset_tag: string;
  purchase_date: string;
  warranty_expiry: string;
  installation_date: string;
  location_details: string;
  condition: string;
  notes: string;
}

const CustomerEquipmentForm: React.FC<CustomerEquipmentFormProps> = ({
  customerId,
  initialEquipment = [],
  onEquipmentChange,
  isEditing
}) => {
  const [equipment, setEquipment] = useState<CustomerEquipment[]>(initialEquipment);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<EquipmentFormData>({
    equipment_type_id: '',
    serial_number: '',
    asset_tag: '',
    purchase_date: '',
    warranty_expiry: '',
    installation_date: '',
    location_details: '',
    condition: 'good',
    notes: ''
  });

  useEffect(() => {
    loadEquipmentTypes();
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddForm) {
        handleCancelForm();
      }
    };

    if (showAddForm) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showAddForm]);

  useEffect(() => {
    onEquipmentChange(equipment);
  }, [equipment, onEquipmentChange]);

  const loadEquipmentTypes = async () => {
    try {
      const response = await apiService.getEquipmentOptions();
      if (response.success && response.data) {
        const data = response.data as any;
        setEquipmentTypes(data.equipment_types || []);
      }
    } catch (error) {
      console.error('Error loading equipment types:', error);
      toast.error('Failed to load equipment types');
    }
  };

  const resetForm = () => {
    setFormData({
      equipment_type_id: '',
      serial_number: '',
      asset_tag: '',
      purchase_date: '',
      warranty_expiry: '',
      installation_date: '',
      location_details: '',
      condition: 'good',
      notes: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEquipment = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowAddForm(true);
    setEditingIndex(null);
    resetForm();
  };

  const handleEditEquipment = (index: number) => {
    const equipmentItem = equipment[index];
    setFormData({
      equipment_type_id: equipmentItem.equipment_type_id,
      serial_number: equipmentItem.serial_number,
      asset_tag: equipmentItem.asset_tag || '',
      purchase_date: equipmentItem.purchase_date || '',
      warranty_expiry: equipmentItem.warranty_expiry || '',
      installation_date: equipmentItem.installation_date || '',
      location_details: equipmentItem.location_details || '',
      condition: equipmentItem.condition,
      notes: equipmentItem.notes || ''
    });
    setEditingIndex(index);
    setShowAddForm(true);
  };

  const handleRemoveEquipment = async (index: number) => {
    const equipmentItem = equipment[index];
    
    // If this is an existing equipment item (has an ID), we need to delete it from the server
    if (equipmentItem.id && isEditing) {
      try {
        setLoading(true);
        const response = await apiService.deleteCustomerEquipment(equipmentItem.id);
        if (response.success) {
          toast.success('Equipment removed successfully');
        } else {
          const errorMessage = response.error || 'Failed to remove equipment';
          console.error('Equipment deletion error:', response);
          toast.error(errorMessage);
          return;
        }
      } catch (error) {
        console.error('Error removing equipment:', error);
        toast.error('Failed to remove equipment');
        return;
      } finally {
        setLoading(false);
      }
    }

    // Remove from local state
    const newEquipment = equipment.filter((_, i) => i !== index);
    setEquipment(newEquipment);
  };

  const handleSubmitEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling to parent form

    // Validation
    if (!formData.equipment_type_id || !formData.serial_number) {
      toast.error('Equipment type and serial number are required');
      return;
    }

    // Validate serial number format (basic check)
    if (formData.serial_number.trim().length < 3) {
      toast.error('Serial number must be at least 3 characters long');
      return;
    }

    // Check for duplicate serial numbers
    const isDuplicate = equipment.some((item, index) =>
      item.serial_number.toLowerCase() === formData.serial_number.toLowerCase() && index !== editingIndex
    );

    if (isDuplicate) {
      toast.error('Serial number already exists for this customer');
      return;
    }

    // Validate dates if provided
    if (formData.purchase_date && formData.warranty_expiry) {
      const purchaseDate = new Date(formData.purchase_date);
      const warrantyDate = new Date(formData.warranty_expiry);

      if (warrantyDate < purchaseDate) {
        toast.error('Warranty expiry date cannot be before purchase date');
        return;
      }
    }

    if (formData.purchase_date && formData.installation_date) {
      const purchaseDate = new Date(formData.purchase_date);
      const installationDate = new Date(formData.installation_date);

      if (installationDate < purchaseDate) {
        toast.error('Installation date cannot be before purchase date');
        return;
      }
    }

    try {
      setLoading(true);

      // Find the selected equipment type for display
      const selectedEquipmentType = equipmentTypes.find(et => et.id === formData.equipment_type_id);

      if (editingIndex !== null) {
        // Editing existing equipment
        const existingEquipment = equipment[editingIndex];
        
        if (existingEquipment.id && isEditing) {
          // Update on server if it's an existing equipment
          const response = await apiService.updateCustomerEquipment(existingEquipment.id, {
            ...formData,
            customer_id: customerId
          });

          if (!response.success) {
            const errorMessage = response.error || 'Failed to update equipment';
            console.error('Equipment update error:', response);
            toast.error(errorMessage);
            return;
          }
        }

        // Update local state
        const newEquipment = [...equipment];
        newEquipment[editingIndex] = {
          ...existingEquipment,
          ...formData,
          equipment_type: selectedEquipmentType
        };
        setEquipment(newEquipment);
        toast.success('Equipment updated successfully');
      } else {
        // Adding new equipment
        const newEquipmentItem: CustomerEquipment = {
          id: `temp-${Date.now()}`, // Temporary ID for new items
          company_id: '',
          customer_id: customerId || '',
          ...formData,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          equipment_type: selectedEquipmentType
        };

        // If we're editing an existing customer, create the equipment on the server
        if (customerId && isEditing) {
          const response = await apiService.createCustomerEquipment({
            ...formData,
            customer_id: customerId
          });

          if (response.success && response.data) {
            newEquipmentItem.id = response.data.id;
          } else {
            const errorMessage = response.error || 'Failed to add equipment';
            console.error('Equipment creation error:', response);
            toast.error(errorMessage);
            return;
          }
        }

        setEquipment([...equipment, newEquipmentItem]);
        toast.success('Equipment added successfully');
      }

      setShowAddForm(false);
      setEditingIndex(null);
      resetForm();
    } catch (error) {
      console.error('Error saving equipment:', error);
      toast.error('Failed to save equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowAddForm(false);
    setEditingIndex(null);
    resetForm();
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'needs_repair': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-900">Customer Equipment</h4>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {equipment.length} equipment item{equipment.length !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={handleAddEquipment}
            disabled={loading}
            className="bg-primary text-white px-3 py-1 rounded-md text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <i className="ri-add-line mr-1"></i>
            Add Equipment
          </button>
        </div>
      </div>

      {/* Equipment List */}
      {equipment.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Equipment</div>
              <div className="col-span-2">Serial Number</div>
              <div className="col-span-2">Condition</div>
              <div className="col-span-2">Purchase Date</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-1">Actions</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {equipment.map((item, index) => (
              <div key={item.id || index} className="px-4 py-3 hover:bg-gray-50">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3">
                    <div className="text-sm font-medium text-gray-900">
                      {item.equipment_type?.name || 'Unknown Type'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.equipment_type?.brand} {item.equipment_type?.model}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-900">{item.serial_number}</div>
                    {item.asset_tag && (
                      <div className="text-xs text-gray-500">Tag: {item.asset_tag}</div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                      {item.condition}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-900">
                      {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-900 truncate">
                      {item.location_details || 'N/A'}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => handleEditEquipment(index)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        title="Edit"
                      >
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipment(index)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        title="Remove"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {equipment.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <i className="ri-tools-line text-3xl text-gray-400 mb-2"></i>
          <p className="text-sm text-gray-500">No equipment assigned to this customer</p>
          <button
            type="button"
            onClick={handleAddEquipment}
            className="mt-2 text-primary hover:text-primary/80 text-sm font-medium"
          >
            Add the first equipment item
          </button>
        </div>
      )}

      {/* Add/Edit Equipment Modal */}
      {showAddForm && createPortal(
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelForm();
            }
          }}
        >
          <div
            className="relative top-10 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingIndex !== null ? 'Edit Equipment' : 'Add Equipment'}
                </h3>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmitEquipment} className="space-y-4">
                {/* Equipment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment Type *
                  </label>
                  <select
                    name="equipment_type_id"
                    value={formData.equipment_type_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select Equipment Type</option>
                    {equipmentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} - {type.brand} {type.model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Serial Number *
                    </label>
                    <input
                      type="text"
                      name="serial_number"
                      value={formData.serial_number}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asset Tag
                    </label>
                    <input
                      type="text"
                      name="asset_tag"
                      value={formData.asset_tag}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="needs_repair">Needs Repair</option>
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      name="purchase_date"
                      value={formData.purchase_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warranty Expiry
                    </label>
                    <input
                      type="date"
                      name="warranty_expiry"
                      value={formData.warranty_expiry}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Installation Date
                    </label>
                    <input
                      type="date"
                      name="installation_date"
                      value={formData.installation_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Location Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Details
                  </label>
                  <input
                    type="text"
                    name="location_details"
                    value={formData.location_details}
                    onChange={handleInputChange}
                    placeholder="e.g., Main Office, Floor 2, Room 201"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Additional notes about this equipment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      editingIndex !== null ? 'Update Equipment' : 'Add Equipment'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CustomerEquipmentForm;
