import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { EquipmentType, Part, EquipmentInventoryCompatibility } from '../types';

interface EquipmentCompatibilityState {
  selectedEquipmentType: EquipmentType | null;
  compatibility: EquipmentInventoryCompatibility[];
  availableEquipmentTypes: EquipmentType[];
  availableParts: Part[];
  loading: boolean;
  showAddModal: boolean;
}

const EquipmentCompatibility: React.FC = () => {
  const [state, setState] = useState<EquipmentCompatibilityState>({
    selectedEquipmentType: null,
    compatibility: [],
    availableEquipmentTypes: [],
    availableParts: [],
    loading: false,
    showAddModal: false,
  });

  const [formData, setFormData] = useState({
    part_id: '',
    compatibility_type: 'compatible',
    usage_notes: ''
  });

  const compatibilityTypes = [
    { value: 'compatible', label: 'Compatible', color: 'green' },
    { value: 'recommended', label: 'Recommended', color: 'blue' },
    { value: 'alternative', label: 'Alternative', color: 'yellow' }
  ];

  useEffect(() => {
    loadEquipmentOptions();
  }, []);

  useEffect(() => {
    if (state.selectedEquipmentType) {
      loadCompatibility();
    }
  }, [state.selectedEquipmentType]);

  const loadEquipmentOptions = async () => {
    try {
      const response = await apiService.get<{
        equipment_types: EquipmentType[];
        parts: Part[];
      }>('/equipment/options');
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          availableEquipmentTypes: response.data?.equipment_types || [],
          availableParts: response.data?.parts || []
        }));
      }
    } catch (error) {
      console.error('Error loading equipment options:', error);
    }
  };

  const loadCompatibility = async () => {
    if (!state.selectedEquipmentType) return;

    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const response = await apiService.get<{
        compatibility: EquipmentInventoryCompatibility[];
      }>(`/equipment/types/${state.selectedEquipmentType.id}/compatibility`);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          compatibility: response.data?.compatibility || [],
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Error loading compatibility:', error);
      toast.error('Failed to load compatibility data');
      setState(prev => ({ ...prev, loading: false, compatibility: [] }));
    }
  };

  const handleAddCompatibility = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.selectedEquipmentType || !formData.part_id) {
      toast.error('Please select equipment type and part');
      return;
    }

    try {
      const data = {
        equipment_type_id: state.selectedEquipmentType.id,
        ...formData
      };

      const response = await apiService.post('/equipment/compatibility', data);
      if (response.success) {
        toast.success('Compatibility added successfully');
        setState(prev => ({ ...prev, showAddModal: false }));
        setFormData({ part_id: '', compatibility_type: 'compatible', usage_notes: '' });
        loadCompatibility();
      } else {
        throw new Error(response.error || 'Failed to add compatibility');
      }
    } catch (error: any) {
      console.error('Error adding compatibility:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add compatibility';
      toast.error(errorMessage);
    }
  };

  const handleRemoveCompatibility = async (compatibilityId: string) => {
    try {
      const response = await apiService.delete(`/equipment/compatibility/${compatibilityId}`);
      if (response.success) {
        toast.success('Compatibility removed successfully');
        loadCompatibility();
      } else {
        throw new Error(response.error || 'Failed to remove compatibility');
      }
    } catch (error: any) {
      console.error('Error removing compatibility:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to remove compatibility';
      toast.error(errorMessage);
    }
  };

  const getCompatibilityBadge = (type: string) => {
    const config = compatibilityTypes.find(t => t.value === type);
    if (!config) return null;

    const colorClasses = {
      green: 'bg-green-100 text-green-800 border-green-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${colorClasses[config.color as keyof typeof colorClasses]}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Equipment-Inventory Compatibility</h2>
      </div>

      {/* Equipment Type Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Equipment Type</label>
          <select
            value={state.selectedEquipmentType?.id || ''}
            onChange={(e) => {
              const equipmentType = state.availableEquipmentTypes.find(et => et.id === e.target.value);
              setState(prev => ({ ...prev, selectedEquipmentType: equipmentType || null }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose an equipment type...</option>
            {state.availableEquipmentTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.brand} {type.model} ({type.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compatibility Management */}
      {state.selectedEquipmentType && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Compatible Parts for {state.selectedEquipmentType.brand} {state.selectedEquipmentType.model}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manage which inventory items are compatible with this equipment type
                </p>
              </div>
              <button
                onClick={() => setState(prev => ({ ...prev, showAddModal: true }))}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <i className="ri-add-line"></i>
                <span>Add Compatibility</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {state.loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : state.compatibility.length > 0 ? (
              <div className="space-y-4">
                {state.compatibility.map((comp) => (
                  <div key={comp.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {comp.part?.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Part #: {comp.part?.part_number} | Brand: {comp.part?.brand}
                          </p>
                        </div>
                        {getCompatibilityBadge(comp.compatibility_type)}
                      </div>
                      {comp.usage_notes && (
                        <p className="text-sm text-gray-600 mt-2">{comp.usage_notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveCompatibility(comp.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remove compatibility"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="ri-link-unlink text-4xl text-gray-400 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No compatible parts defined</h3>
                <p className="text-gray-500">Add compatible inventory items for this equipment type.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Compatibility Modal */}
      {state.showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Compatible Part</h3>
                <button
                  onClick={() => setState(prev => ({ ...prev, showAddModal: false }))}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleAddCompatibility} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Part *</label>
                  <select
                    required
                    value={formData.part_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, part_id: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a part</option>
                    {state.availableParts.map(part => (
                      <option key={part.id} value={part.id}>
                        {part.name} ({part.part_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Compatibility Type</label>
                  <select
                    value={formData.compatibility_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, compatibility_type: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {compatibilityTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Usage Notes</label>
                  <textarea
                    rows={3}
                    value={formData.usage_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, usage_notes: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="How is this part used with this equipment?"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, showAddModal: false }))}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Add Compatibility
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentCompatibility;
