import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { Part, InventoryOptions } from '../types';

interface InventoryFormProps {
  item?: Part | null;
  options?: InventoryOptions | null;
  onSave: () => void;
  onCancel: () => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ item, options, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    part_number: '',
    name: '',
    description: '',
    category: '',
    equipment_type_id: '',
    unit_price: '',
    cost_price: '',
    current_stock: '',
    min_stock_level: '',
    max_stock_level: '',
    status: 'available',
    supplier_info: '',
    image_url: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        part_number: item.part_number || '',
        name: item.name || '',
        description: item.description || '',
        category: item.category || '',
        equipment_type_id: item.equipment_type_id || '',
        unit_price: item.unit_price?.toString() || '',
        cost_price: item.cost_price?.toString() || '',
        current_stock: item.current_stock?.toString() || '',
        min_stock_level: item.min_stock_level?.toString() || '',
        max_stock_level: item.max_stock_level?.toString() || '',
        status: item.status || 'available',
        supplier_info: item.supplier_info ? JSON.stringify(item.supplier_info) : '',
        image_url: item.image_url || ''
      });
    }
  }, [item]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.part_number.trim()) {
      newErrors.part_number = 'Part number is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.unit_price || parseFloat(formData.unit_price) <= 0) {
      newErrors.unit_price = 'Valid unit price is required';
    }

    if (formData.cost_price && parseFloat(formData.cost_price) < 0) {
      newErrors.cost_price = 'Cost price cannot be negative';
    }

    if (formData.current_stock && parseInt(formData.current_stock) < 0) {
      newErrors.current_stock = 'Current stock cannot be negative';
    }

    if (formData.min_stock_level && parseInt(formData.min_stock_level) < 0) {
      newErrors.min_stock_level = 'Minimum stock level cannot be negative';
    }

    if (formData.max_stock_level && parseInt(formData.max_stock_level) < 0) {
      newErrors.max_stock_level = 'Maximum stock level cannot be negative';
    }

    if (formData.min_stock_level && formData.max_stock_level && 
        parseInt(formData.min_stock_level) > parseInt(formData.max_stock_level)) {
      newErrors.max_stock_level = 'Maximum stock level must be greater than minimum';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        unit_price: parseFloat(formData.unit_price),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        current_stock: formData.current_stock ? parseInt(formData.current_stock) : 0,
        min_stock_level: formData.min_stock_level ? parseInt(formData.min_stock_level) : 0,
        max_stock_level: formData.max_stock_level ? parseInt(formData.max_stock_level) : 100,
        supplier_info: formData.supplier_info ? JSON.parse(formData.supplier_info) : null
      };

      const response = item 
        ? await apiService.put(`/inventory/${item.id}`, submitData)
        : await apiService.post('/inventory', submitData);

      if (response.success) {
        onSave();
      } else {
        toast.error(response.error || 'Failed to save inventory item');
      }
    } catch (error) {
      console.error('Error saving inventory item:', error);
      toast.error('Failed to save inventory item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {item ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Part Number *
              </label>
              <input
                type="text"
                name="part_number"
                value={formData.part_number}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.part_number ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter part number"
              />
              {errors.part_number && (
                <p className="text-red-600 text-xs mt-1">{errors.part_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter item name"
              />
              {errors.name && (
                <p className="text-red-600 text-xs mt-1">{errors.name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter item description"
            />
          </div>

          {/* Category and Equipment Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                list="categories"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter or select category"
              />
              <datalist id="categories">
                {options?.categories.map(category => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Type
              </label>
              <select
                name="equipment_type_id"
                value={formData.equipment_type_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select an equipment type</option>
                {options?.equipment_types.map(equipmentType => (
                  <option key={equipmentType.id} value={equipmentType.id}>
                    {equipmentType.brand} - {equipmentType.model} ({equipmentType.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price * ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.unit_price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.unit_price && (
                <p className="text-red-600 text-xs mt-1">{errors.unit_price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.cost_price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.cost_price && (
                <p className="text-red-600 text-xs mt-1">{errors.cost_price}</p>
              )}
            </div>
          </div>

          {/* Stock Levels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock
              </label>
              <input
                type="number"
                min="0"
                name="current_stock"
                value={formData.current_stock}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.current_stock ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.current_stock && (
                <p className="text-red-600 text-xs mt-1">{errors.current_stock}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Stock Level
              </label>
              <input
                type="number"
                min="0"
                name="min_stock_level"
                value={formData.min_stock_level}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.min_stock_level ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.min_stock_level && (
                <p className="text-red-600 text-xs mt-1">{errors.min_stock_level}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Stock Level
              </label>
              <input
                type="number"
                min="0"
                name="max_stock_level"
                value={formData.max_stock_level}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.max_stock_level ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="100"
              />
              {errors.max_stock_level && (
                <p className="text-red-600 text-xs mt-1">{errors.max_stock_level}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {options?.statuses.map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              <span>{item ? 'Update Item' : 'Create Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryForm;
