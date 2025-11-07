import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { EquipmentType, EquipmentTypesResponse } from '../types';
import ImageUpload from './ImageUpload';

interface EquipmentTypesState {
  equipmentTypes: EquipmentType[];
  loading: boolean;
  searchTerm: string;
  categoryFilter: string;
  brandFilter: string;
  currentPage: number;
  totalPages: number;
  showModal: boolean;
  showDeleteModal: boolean;
  editingEquipmentType: EquipmentType | null;
  deletingEquipmentType: EquipmentType | null;
  availableCategories: string[];
  availableBrands: string[];
}

const EquipmentTypes: React.FC = () => {
  const [state, setState] = useState<EquipmentTypesState>({
    equipmentTypes: [],
    loading: true,
    searchTerm: '',
    categoryFilter: '',
    brandFilter: '',
    currentPage: 1,
    totalPages: 1,
    showModal: false,
    showDeleteModal: false,
    editingEquipmentType: null,
    deletingEquipmentType: null,
    availableCategories: [],
    availableBrands: [],
  });

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    description: '',
    manual_url: '',
    warranty_period_months: 12,
    image_url: ''
  });

  useEffect(() => {
    loadEquipmentTypes();
    loadEquipmentOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentPage, state.searchTerm, state.categoryFilter, state.brandFilter]);

  const loadEquipmentOptions = async () => {
    try {
      const response = await apiService.get<{
        categories: string[];
        brands: string[];
      }>('/equipment/options');
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          availableCategories: response.data?.categories || [],
          availableBrands: response.data?.brands || []
        }));
      }
    } catch (error) {
      console.error('Error loading equipment options:', error);
    }
  };

  const loadEquipmentTypes = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const params: any = {
        page: state.currentPage,
        limit: 10,
      };
      
      if (state.searchTerm) params.search = state.searchTerm;
      if (state.categoryFilter) params.category = state.categoryFilter;
      if (state.brandFilter) params.brand = state.brandFilter;

      const response = await apiService.get<EquipmentTypesResponse>('/equipment/types', params);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          equipmentTypes: response.data?.equipment_types || [],
          totalPages: response.data?.pagination?.totalPages || 1,
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Error loading equipment types:', error);
      toast.error('Failed to load equipment types');
      setState(prev => ({ ...prev, loading: false, equipmentTypes: [] }));
    }
  };

  const handleSearch = (value: string) => {
    setState(prev => ({ ...prev, searchTerm: value, currentPage: 1 }));
  };



  const handleBrandFilter = (brand: string) => {
    setState(prev => ({ ...prev, brandFilter: brand, currentPage: 1 }));
  };

  const openModal = (equipmentType?: EquipmentType) => {
    if (equipmentType) {
      setState(prev => ({ ...prev, editingEquipmentType: equipmentType, showModal: true }));
      setFormData({
        name: equipmentType.name,
        brand: equipmentType.brand,
        model: equipmentType.model,
        description: equipmentType.description || '',
        manual_url: equipmentType.manual_url || '',
        warranty_period_months: equipmentType.warranty_period_months,
        image_url: equipmentType.image_url || ''
      });
    } else {
      setState(prev => ({ ...prev, editingEquipmentType: null, showModal: true }));
      setFormData({
        name: '',
        brand: '',
        model: '',
        description: '',
        manual_url: '',
        warranty_period_months: 12,
        image_url: ''
      });
    }
  };

  const closeModal = () => {
    setState(prev => ({ ...prev, showModal: false, editingEquipmentType: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Basic validation
      if (!formData.name || !formData.brand || !formData.model) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (state.editingEquipmentType) {
        const response = await apiService.put(`/equipment/types/${state.editingEquipmentType.id}`, formData);
        if (response.success) {
          toast.success('Equipment type updated successfully');
        } else {
          throw new Error(response.error || 'Failed to update equipment type');
        }
      } else {
        const response = await apiService.post('/equipment/types', formData);
        if (response.success) {
          toast.success('Equipment type created successfully');
        } else {
          throw new Error(response.error || 'Failed to create equipment type');
        }
      }

      closeModal();
      loadEquipmentTypes();
      loadEquipmentOptions(); // Refresh options in case new categories/brands were added
    } catch (error: any) {
      console.error('Error saving equipment type:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save equipment type';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!state.deletingEquipmentType) return;

    try {
      const response = await apiService.delete(`/equipment/types/${state.deletingEquipmentType.id}`);
      if (response.success) {
        toast.success('Equipment type deleted successfully');
        setState(prev => ({ ...prev, showDeleteModal: false, deletingEquipmentType: null }));
        loadEquipmentTypes();
      } else {
        throw new Error(response.error || 'Failed to delete equipment type');
      }
    } catch (error: any) {
      console.error('Error deleting equipment type:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete equipment type';
      toast.error(errorMessage);
    }
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Equipment Types</h2>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <i className="ri-add-line"></i>
          <span>Add Equipment Type</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search equipment types..."
                  value={state.searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <i className="ri-search-line text-gray-400"></i>
                </div>
              </div>



              {/* Brand Filter */}
              <select
                value={state.brandFilter}
                onChange={(e) => handleBrandFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Brands</option>
                {state.availableBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={loadEquipmentTypes}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <i className="ri-refresh-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.equipmentTypes.map((equipmentType) => (
          <div key={equipmentType.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Equipment Image */}
            {equipmentType.image_url ? (
              <div className="h-48 bg-gray-100">
                <img
                  src={equipmentType.image_url.startsWith('/uploads') ? `http://localhost:3001${equipmentType.image_url}` : equipmentType.image_url}
                  alt={`${equipmentType.brand} ${equipmentType.model}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <i className="ri-image-line text-4xl text-gray-400 mb-2"></i>
                  <p className="text-sm text-gray-500">No image</p>
                </div>
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {equipmentType.brand} {equipmentType.model}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{equipmentType.name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openModal(equipmentType)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    title="Edit equipment type"
                  >
                    <i className="ri-edit-line"></i>
                  </button>
                  <button
                    onClick={() => setState(prev => ({ ...prev, showDeleteModal: true, deletingEquipmentType: equipmentType }))}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    title="Delete equipment type"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>

              {equipmentType.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {equipmentType.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Warranty: {equipmentType.warranty_period_months} months</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {state.equipmentTypes.length === 0 && (
        <div className="text-center py-12">
          <i className="ri-tools-line text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment types found</h3>
          <p className="text-gray-500">Get started by adding your first equipment type.</p>
        </div>
      )}

      {/* Pagination */}
      {state.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <button
            onClick={() => setState(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
            disabled={state.currentPage === 1}
            className={`px-4 py-2 rounded-lg font-medium ${
              state.currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            <i className="ri-arrow-left-s-line"></i>
            Previous
          </button>

          <div className="flex items-center space-x-2">
            {Array.from({ length: state.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setState(prev => ({ ...prev, currentPage: page }))}
                className={`w-10 h-10 rounded-lg font-medium ${
                  state.currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setState(prev => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
            disabled={state.currentPage === state.totalPages}
            className={`px-4 py-2 rounded-lg font-medium ${
              state.currentPage === state.totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Next
            <i className="ri-arrow-right-s-line"></i>
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {state.showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {state.editingEquipmentType ? 'Edit Equipment Type' : 'Add New Equipment Type'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Equipment Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Printer, Scanner, Computer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Brand *</label>
                    <input
                      type="text"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., HP, Canon, Dell"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Model *</label>
                    <input
                      type="text"
                      required
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., LaserJet Pro M404n"
                    />
                  </div>



                  <div>
                    <label className="block text-sm font-medium text-gray-700">Warranty Period (months)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={formData.warranty_period_months}
                      onChange={(e) => setFormData(prev => ({ ...prev, warranty_period_months: parseInt(e.target.value) }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Manual URL</label>
                    <input
                      type="url"
                      value={formData.manual_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, manual_url: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of the equipment..."
                  />
                </div>

                {/* Image Upload */}
                <ImageUpload
                  currentImageUrl={formData.image_url}
                  onImageUploaded={(imageUrl) => setFormData(prev => ({ ...prev, image_url: imageUrl }))}
                  onImageRemoved={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                />

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Save Equipment Type
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {state.showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <i className="ri-delete-bin-line text-red-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Equipment Type</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {state.deletingEquipmentType?.brand} {state.deletingEquipmentType?.model}?
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setState(prev => ({ ...prev, showDeleteModal: false, deletingEquipmentType: null }))}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentTypes;
