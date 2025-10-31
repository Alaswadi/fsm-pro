import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { CustomerEquipment, CustomerEquipmentResponse, Customer, EquipmentType } from '../types';

interface CustomerEquipmentState {
  customerEquipment: CustomerEquipment[];
  loading: boolean;
  searchTerm: string;
  customerFilter: string;
  equipmentTypeFilter: string;
  conditionFilter: string;
  currentPage: number;
  totalPages: number;
  showModal: boolean;
  showDeleteModal: boolean;
  editingEquipment: CustomerEquipment | null;
  deletingEquipment: CustomerEquipment | null;
  availableCustomers: Customer[];
  availableEquipmentTypes: EquipmentType[];
}

const CustomerEquipmentComponent: React.FC = () => {
  const [state, setState] = useState<CustomerEquipmentState>({
    customerEquipment: [],
    loading: true,
    searchTerm: '',
    customerFilter: '',
    equipmentTypeFilter: '',
    conditionFilter: '',
    currentPage: 1,
    totalPages: 1,
    showModal: false,
    showDeleteModal: false,
    editingEquipment: null,
    deletingEquipment: null,
    availableCustomers: [],
    availableEquipmentTypes: [],
  });

  const [formData, setFormData] = useState({
    customer_id: '',
    equipment_type_id: '',
    serial_number: '',
    asset_tag: '',
    purchase_date: '',
    warranty_expiry: '',
    installation_date: '',
    location_details: '',
    condition: 'good',
    last_service_date: '',
    next_service_date: '',
    notes: ''
  });

  const conditionOptions = [
    { value: 'good', label: 'Good', color: 'green' },
    { value: 'fair', label: 'Fair', color: 'yellow' },
    { value: 'poor', label: 'Poor', color: 'orange' },
    { value: 'needs_repair', label: 'Needs Repair', color: 'red' }
  ];

  useEffect(() => {
    loadCustomerEquipment();
    loadEquipmentOptions();
  }, [state.currentPage, state.searchTerm, state.customerFilter, state.equipmentTypeFilter, state.conditionFilter]);

  const loadEquipmentOptions = async () => {
    try {
      const response = await apiService.get<{
        customers: Customer[];
        equipment_types: EquipmentType[];
      }>('/equipment/options');
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          availableCustomers: response.data?.customers || [],
          availableEquipmentTypes: response.data?.equipment_types || []
        }));
      }
    } catch (error) {
      console.error('Error loading equipment options:', error);
    }
  };

  const loadCustomerEquipment = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const params: any = {
        page: state.currentPage,
        limit: 10,
      };
      
      if (state.searchTerm) params.search = state.searchTerm;
      if (state.customerFilter) params.customer_id = state.customerFilter;
      if (state.equipmentTypeFilter) params.equipment_type_id = state.equipmentTypeFilter;
      if (state.conditionFilter) params.condition = state.conditionFilter;

      const response = await apiService.get<CustomerEquipmentResponse>('/equipment/customer-equipment', params);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          customerEquipment: response.data?.customer_equipment || [],
          totalPages: response.data?.pagination?.totalPages || 1,
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Error loading customer equipment:', error);
      toast.error('Failed to load customer equipment');
      setState(prev => ({ ...prev, loading: false, customerEquipment: [] }));
    }
  };

  const handleSearch = (value: string) => {
    setState(prev => ({ ...prev, searchTerm: value, currentPage: 1 }));
  };

  const openModal = (equipment?: CustomerEquipment) => {
    if (equipment) {
      setState(prev => ({ ...prev, editingEquipment: equipment, showModal: true }));
      setFormData({
        customer_id: equipment.customer_id,
        equipment_type_id: equipment.equipment_type_id,
        serial_number: equipment.serial_number,
        asset_tag: equipment.asset_tag || '',
        purchase_date: equipment.purchase_date || '',
        warranty_expiry: equipment.warranty_expiry || '',
        installation_date: equipment.installation_date || '',
        location_details: equipment.location_details || '',
        condition: equipment.condition,
        last_service_date: equipment.last_service_date || '',
        next_service_date: equipment.next_service_date || '',
        notes: equipment.notes || ''
      });
    } else {
      setState(prev => ({ ...prev, editingEquipment: null, showModal: true }));
      setFormData({
        customer_id: '',
        equipment_type_id: '',
        serial_number: '',
        asset_tag: '',
        purchase_date: '',
        warranty_expiry: '',
        installation_date: '',
        location_details: '',
        condition: 'good',
        last_service_date: '',
        next_service_date: '',
        notes: ''
      });
    }
  };

  const closeModal = () => {
    setState(prev => ({ ...prev, showModal: false, editingEquipment: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Basic validation
      if (!formData.customer_id || !formData.equipment_type_id || !formData.serial_number) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (state.editingEquipment) {
        const response = await apiService.put(`/equipment/customer-equipment/${state.editingEquipment.id}`, formData);
        if (response.success) {
          toast.success('Customer equipment updated successfully');
        } else {
          throw new Error(response.error || 'Failed to update customer equipment');
        }
      } else {
        const response = await apiService.post('/equipment/customer-equipment', formData);
        if (response.success) {
          toast.success('Customer equipment created successfully');
        } else {
          throw new Error(response.error || 'Failed to create customer equipment');
        }
      }

      closeModal();
      loadCustomerEquipment();
    } catch (error: any) {
      console.error('Error saving customer equipment:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save customer equipment';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!state.deletingEquipment) return;

    try {
      const response = await apiService.delete(`/equipment/customer-equipment/${state.deletingEquipment.id}`);
      if (response.success) {
        toast.success('Customer equipment deleted successfully');
        setState(prev => ({ ...prev, showDeleteModal: false, deletingEquipment: null }));
        loadCustomerEquipment();
      } else {
        throw new Error(response.error || 'Failed to delete customer equipment');
      }
    } catch (error: any) {
      console.error('Error deleting customer equipment:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete customer equipment';
      toast.error(errorMessage);
    }
  };

  const getConditionBadge = (condition: string) => {
    const conditionConfig = conditionOptions.find(opt => opt.value === condition);
    if (!conditionConfig) return null;

    const colorClasses = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      red: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${colorClasses[conditionConfig.color as keyof typeof colorClasses]}`}>
        {conditionConfig.label}
      </span>
    );
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
        <h2 className="text-xl font-semibold text-gray-900">Customer Equipment</h2>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <i className="ri-add-line"></i>
          <span>Add Equipment</span>
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
                  placeholder="Search equipment..."
                  value={state.searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <i className="ri-search-line text-gray-400"></i>
                </div>
              </div>

              {/* Customer Filter */}
              <select
                value={state.customerFilter}
                onChange={(e) => setState(prev => ({ ...prev, customerFilter: e.target.value, currentPage: 1 }))}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Customers</option>
                {state.availableCustomers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>

              {/* Equipment Type Filter */}
              <select
                value={state.equipmentTypeFilter}
                onChange={(e) => setState(prev => ({ ...prev, equipmentTypeFilter: e.target.value, currentPage: 1 }))}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Equipment Types</option>
                {state.availableEquipmentTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.brand} {type.model}</option>
                ))}
              </select>

              {/* Condition Filter */}
              <select
                value={state.conditionFilter}
                onChange={(e) => setState(prev => ({ ...prev, conditionFilter: e.target.value, currentPage: 1 }))}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Conditions</option>
                {conditionOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={loadCustomerEquipment}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <i className="ri-refresh-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Serial Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.customerEquipment.map((equipment) => (
                <tr key={equipment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {equipment.equipment_type?.brand} {equipment.equipment_type?.model}
                      </div>
                      <div className="text-sm text-gray-500">{equipment.equipment_type?.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{equipment.customer?.name}</div>
                    <div className="text-sm text-gray-500">{equipment.customer?.company_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{equipment.serial_number}</div>
                    {equipment.asset_tag && (
                      <div className="text-sm text-gray-500">Asset: {equipment.asset_tag}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getConditionBadge(equipment.condition)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {equipment.location_details || 'Not specified'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openModal(equipment)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                        title="Edit equipment"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => setState(prev => ({ ...prev, showDeleteModal: true, deletingEquipment: equipment }))}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                        title="Delete equipment"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {state.customerEquipment.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-customer-service-line text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customer equipment found</h3>
            <p className="text-gray-500">Get started by adding equipment to customers.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {state.showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {state.editingEquipment ? 'Edit Customer Equipment' : 'Add New Customer Equipment'}
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
                    <label className="block text-sm font-medium text-gray-700">Customer *</label>
                    <select
                      required
                      value={formData.customer_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a customer</option>
                      {state.availableCustomers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} {customer.company_name && `(${customer.company_name})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Equipment Type *</label>
                    <select
                      required
                      value={formData.equipment_type_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, equipment_type_id: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select equipment type</option>
                      {state.availableEquipmentTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.brand} {type.model} ({type.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Serial Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.serial_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter serial number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Asset Tag</label>
                    <input
                      type="text"
                      value={formData.asset_tag}
                      onChange={(e) => setFormData(prev => ({ ...prev, asset_tag: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Internal asset tag"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                    <input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Warranty Expiry</label>
                    <input
                      type="date"
                      value={formData.warranty_expiry}
                      onChange={(e) => setFormData(prev => ({ ...prev, warranty_expiry: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Installation Date</label>
                    <input
                      type="date"
                      value={formData.installation_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, installation_date: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Condition</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {conditionOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location Details</label>
                  <input
                    type="text"
                    value={formData.location_details}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_details: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Specific location at customer site"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes about this equipment..."
                  />
                </div>

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
                    Save Equipment
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
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Customer Equipment</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this equipment? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setState(prev => ({ ...prev, showDeleteModal: false, deletingEquipment: null }))}
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

export default CustomerEquipmentComponent;
