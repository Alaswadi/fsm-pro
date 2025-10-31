import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { Customer, CustomersResponse, CustomerEquipment } from '../types';
import CustomerEquipmentForm from '../components/CustomerEquipmentForm';

interface CustomersPageState {
  customers: Customer[];
  loading: boolean;
  searchTerm: string;
  statusFilter: string;
  industryFilter: string;
  priorityFilter: string;
  currentPage: number;
  totalPages: number;
  showModal: boolean;
  showDeleteModal: boolean;
  showProfileModal: boolean;
  editingCustomer: Customer | null;
  deletingCustomer: Customer | null;
  viewingCustomer: Customer | null;
  activeDropdown: string | null;
  customerEquipment: CustomerEquipment[];
}

const Customers: React.FC = () => {
  const [state, setState] = useState<CustomersPageState>({
    customers: [],
    loading: true,
    searchTerm: '',
    statusFilter: '',
    industryFilter: '',
    priorityFilter: '',
    currentPage: 1,
    totalPages: 1,
    showModal: false,
    showDeleteModal: false,
    showProfileModal: false,
    editingCustomer: null,
    deletingCustomer: null,
    viewingCustomer: null,
    activeDropdown: null,
    customerEquipment: [],
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp_number: '',
    address: '',
    company_name: '',
    industry: '',
    company_size: '',
    business_type: '',
    tax_id: '',
    website: '',
    billing_address: '',
    billing_contact_name: '',
    billing_contact_email: '',
    billing_contact_phone: '',
    preferred_contact_method: 'phone',
    service_tier: 'standard',
    contract_type: '',
    contract_start_date: '',
    contract_end_date: '',
    payment_terms: '',
    credit_limit: '',
    discount_percentage: '',
    priority_level: 'normal',
    assigned_account_manager: '',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, [state.currentPage, state.searchTerm, state.statusFilter, state.industryFilter, state.priorityFilter]);

  const loadCustomers = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const params: any = {
        page: state.currentPage,
        limit: 10,
      };
      
      if (state.searchTerm) params.search = state.searchTerm;
      if (state.statusFilter) params.status = state.statusFilter;
      if (state.industryFilter) params.industry = state.industryFilter;
      if (state.priorityFilter) params.priority_level = state.priorityFilter;

      const response = await apiService.get<CustomersResponse>('/customers', params);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          customers: response.data?.customers || [],
          totalPages: response.data?.pagination?.totalPages || 1,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setState(prev => ({ ...prev, searchTerm: value, currentPage: 1 }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setState(prev => ({ 
      ...prev, 
      [filterType]: value, 
      currentPage: 1 
    }));
  };

  const handlePageChange = (page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  };

  const handleEquipmentChange = useCallback((equipment: CustomerEquipment[]) => {
    setState(prev => ({ ...prev, customerEquipment: equipment }));
  }, []);

  const loadCustomerEquipment = async (customerId: string) => {
    try {
      const response = await apiService.getCustomerEquipment(customerId);
      if (response.success && response.data) {
        const data = response.data as any;
        setState(prev => ({ ...prev, customerEquipment: data.customer_equipment || [] }));
      }
    } catch (error) {
      console.error('Error loading customer equipment:', error);
      // Don't show error toast here as it's not critical for the form
    }
  };

  const openModal = async (customer?: Customer) => {
    if (customer) {
      setState(prev => ({ ...prev, editingCustomer: customer, showModal: true }));
      setFormData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone,
        whatsapp_number: customer.whatsapp_number || '',
        address: customer.address,
        company_name: customer.company_name || '',
        industry: customer.industry || '',
        company_size: customer.company_size || '',
        business_type: customer.business_type || '',
        tax_id: customer.tax_id || '',
        website: customer.website || '',
        billing_address: customer.billing_address || '',
        billing_contact_name: customer.billing_contact_name || '',
        billing_contact_email: customer.billing_contact_email || '',
        billing_contact_phone: customer.billing_contact_phone || '',
        preferred_contact_method: customer.preferred_contact_method || 'phone',
        service_tier: customer.service_tier || 'standard',
        contract_type: customer.contract_type || '',
        contract_start_date: customer.contract_start_date || '',
        contract_end_date: customer.contract_end_date || '',
        payment_terms: customer.payment_terms || '',
        credit_limit: customer.credit_limit?.toString() || '',
        discount_percentage: customer.discount_percentage?.toString() || '',
        priority_level: customer.priority_level || 'normal',
        assigned_account_manager: customer.assigned_account_manager || '',
        notes: customer.notes || '',
      });
      // Load existing equipment for this customer
      await loadCustomerEquipment(customer.id);
    } else {
      setState(prev => ({ ...prev, editingCustomer: null, showModal: true, customerEquipment: [] }));
      setFormData({
        name: '',
        email: '',
        phone: '',
        whatsapp_number: '',
        address: '',
        company_name: '',
        industry: '',
        company_size: '',
        business_type: '',
        tax_id: '',
        website: '',
        billing_address: '',
        billing_contact_name: '',
        billing_contact_email: '',
        billing_contact_phone: '',
        preferred_contact_method: 'phone',
        service_tier: 'standard',
        contract_type: '',
        contract_start_date: '',
        contract_end_date: '',
        payment_terms: '',
        credit_limit: '',
        discount_percentage: '',
        priority_level: 'normal',
        assigned_account_manager: '',
        notes: '',
      });
    }
  };

  const closeModal = () => {
    setState(prev => ({
      ...prev,
      showModal: false,
      editingCustomer: null,
      customerEquipment: []
    }));
  };

  const openDeleteModal = (customer: Customer) => {
    setState(prev => ({ 
      ...prev, 
      deletingCustomer: customer, 
      showDeleteModal: true 
    }));
  };

  const closeDeleteModal = () => {
    setState(prev => ({ 
      ...prev, 
      showDeleteModal: false, 
      deletingCustomer: null 
    }));
  };

  const openProfileModal = async (customer: Customer) => {
    setState(prev => ({
      ...prev,
      viewingCustomer: customer,
      showProfileModal: true
    }));
    // Load customer equipment for the profile view
    await loadCustomerEquipment(customer.id);
  };

  const closeProfileModal = () => {
    setState(prev => ({
      ...prev,
      showProfileModal: false,
      viewingCustomer: null,
      customerEquipment: []
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : 0,
      };

      let response;
      let customerId: string;

      if (state.editingCustomer) {
        // Update existing customer
        response = await apiService.updateCustomer(state.editingCustomer.id, submitData);
        customerId = state.editingCustomer.id;
      } else {
        // Create new customer
        response = await apiService.createCustomer(submitData);
        customerId = response.data?.id;
      }

      if (response.success) {
        // Handle equipment changes for both new and existing customers
        if (state.customerEquipment.length > 0 && customerId) {
          try {
            // For new customers: create all equipment items
            // For existing customers: equipment changes are already handled by the CustomerEquipmentForm component
            if (!state.editingCustomer) {
              // Create equipment items for the new customer
              const equipmentPromises = state.customerEquipment
                .filter(equipment => equipment.id.startsWith('temp-')) // Only create new equipment items
                .map(equipment => {
                  const { id, company_id, customer_id, equipment_type, ...equipmentData } = equipment;
                  return apiService.createCustomerEquipment({
                    ...equipmentData,
                    customer_id: customerId
                  });
                });

              const equipmentResults = await Promise.allSettled(equipmentPromises);

              // Check if any equipment creation failed
              const failedEquipment = equipmentResults.filter(result =>
                result.status === 'rejected' ||
                (result.status === 'fulfilled' && !result.value.success)
              );

              if (failedEquipment.length > 0) {
                console.warn('Some equipment items failed to create:', failedEquipment);
                toast.error(`Customer created successfully, but ${failedEquipment.length} equipment item(s) failed to save`);
              } else if (equipmentPromises.length > 0) {
                toast.success(`Customer and ${equipmentPromises.length} equipment item(s) created successfully`);
              } else {
                toast.success(response.message || 'Customer created successfully');
              }
            } else {
              // For existing customers, equipment changes are handled by the CustomerEquipmentForm component
              toast.success(response.message || 'Customer updated successfully');
            }
          } catch (equipmentError) {
            console.error('Error handling equipment:', equipmentError);
            toast.error(`Customer ${state.editingCustomer ? 'updated' : 'created'} successfully, but equipment changes failed`);
          }
        } else {
          toast.success(response.message || `Customer ${state.editingCustomer ? 'updated' : 'created'} successfully`);
        }

        closeModal();
        loadCustomers();
      } else {
        toast.error(response.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Error submitting customer:', error);
      toast.error('Failed to save customer');
    }
  };

  const handleDelete = async () => {
    if (!state.deletingCustomer) return;

    try {
      const response = await apiService.deleteCustomer(state.deletingCustomer.id);
      if (response.success) {
        toast.success('Customer deactivated successfully');
        closeDeleteModal();
        loadCustomers();
      } else {
        toast.error(response.error || 'Failed to deactivate customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to deactivate customer');
    }
  };

  const toggleCustomerStatus = async (customer: Customer) => {
    try {
      const response = await apiService.toggleCustomerStatus(customer.id);
      if (response.success) {
        toast.success(response.message || 'Customer status updated');
        loadCustomers();
      } else {
        toast.error(response.error || 'Failed to update customer status');
      }
    } catch (error) {
      console.error('Error toggling customer status:', error);
      toast.error('Failed to update customer status');
    }
  };

  const toggleDropdown = (customerId: string) => {
    setState(prev => ({
      ...prev,
      activeDropdown: prev.activeDropdown === customerId ? null : customerId
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'standard': return 'bg-green-100 text-green-800';
      case 'basic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer database and relationships</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
        >
          <i className="ri-add-line"></i>
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search customers..."
                value={state.searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={state.statusFilter}
              onChange={(e) => handleFilterChange('statusFilter', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Industry Filter */}
          <div>
            <select
              value={state.industryFilter}
              onChange={(e) => handleFilterChange('industryFilter', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Industries</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Technology">Technology</option>
              <option value="Finance">Finance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={state.priorityFilter}
              onChange={(e) => handleFilterChange('priorityFilter', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {state.loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">Loading customers...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!state.loading && state.customers.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <i className="ri-group-line text-6xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600 mb-4">
            {state.searchTerm || state.statusFilter || state.industryFilter || state.priorityFilter
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by adding your first customer.'}
          </p>
          {!state.searchTerm && !state.statusFilter && !state.industryFilter && !state.priorityFilter && (
            <button
              onClick={() => openModal()}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add Customer
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {!state.loading && state.customers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <i className="ri-user-line text-primary"></i>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">
                            {customer.priority_level && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(customer.priority_level)}`}>
                                {customer.priority_level}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.company_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{customer.industry || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.phone}</div>
                      <div className="text-sm text-gray-500">{customer.email || 'No email'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.service_tier && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceTierColor(customer.service_tier)}`}>
                            {customer.service_tier}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(customer as any).equipment_count || 0} equipment
                        {(customer as any).total_jobs !== undefined && (
                          <span className="ml-2">• {(customer as any).total_jobs} jobs</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => toggleDropdown(customer.id)}
                          className="text-gray-400 hover:text-gray-600 p-2"
                        >
                          <i className="ri-more-2-line"></i>
                        </button>

                        {state.activeDropdown === customer.id && (
                          <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  openProfileModal(customer);
                                  setState(prev => ({ ...prev, activeDropdown: null }));
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <i className="ri-eye-line mr-2"></i>
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  openModal(customer);
                                  setState(prev => ({ ...prev, activeDropdown: null }));
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <i className="ri-edit-line mr-2"></i>
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  toggleCustomerStatus(customer);
                                  setState(prev => ({ ...prev, activeDropdown: null }));
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <i className={`${customer.is_active ? 'ri-pause-line' : 'ri-play-line'} mr-2`}></i>
                                {customer.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => {
                                  openDeleteModal(customer);
                                  setState(prev => ({ ...prev, activeDropdown: null }));
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <i className="ri-delete-bin-line mr-2"></i>
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!state.loading && state.customers.length > 0 && state.totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {state.currentPage} of {state.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(state.currentPage - 1)}
                disabled={state.currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, state.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 border rounded-md text-sm ${
                      state.currentPage === page
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(state.currentPage + 1)}
                disabled={state.currentPage === state.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {state.showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {state.editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        name="whatsapp_number"
                        value={formData.whatsapp_number}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Company Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Company Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Industry
                      </label>
                      <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Select Industry</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Retail">Retail</option>
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Size
                      </label>
                      <select
                        name="company_size"
                        value={formData.company_size}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Select Size</option>
                        <option value="Small (1-50)">Small (1-50)</option>
                        <option value="Medium (51-200)">Medium (51-200)</option>
                        <option value="Large (201+)">Large (201+)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Type
                      </label>
                      <select
                        name="business_type"
                        value={formData.business_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Select Type</option>
                        <option value="Corporation">Corporation</option>
                        <option value="LLC">LLC</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Non-profit">Non-profit</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax ID
                      </label>
                      <input
                        type="text"
                        name="tax_id"
                        value={formData.tax_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Service Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Service Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Contact Method
                      </label>
                      <select
                        name="preferred_contact_method"
                        value={formData.preferred_contact_method}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Tier
                      </label>
                      <select
                        name="service_tier"
                        value={formData.service_tier}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="basic">Basic</option>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority Level
                      </label>
                      <select
                        name="priority_level"
                        value={formData.priority_level}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contract Type
                      </label>
                      <select
                        name="contract_type"
                        value={formData.contract_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Select Contract Type</option>
                        <option value="one-time">One-time</option>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Customer Equipment */}
                <div>
                  <CustomerEquipmentForm
                    customerId={state.editingCustomer?.id}
                    initialEquipment={state.customerEquipment}
                    onEquipmentChange={handleEquipmentChange}
                    isEditing={!!state.editingCustomer}
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
                    rows={4}
                    placeholder="Additional notes about the customer..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    {state.editingCustomer ? 'Update Customer' : 'Create Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {state.showDeleteModal && state.deletingCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <i className="ri-delete-bin-line text-red-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Customer</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to deactivate <strong>{state.deletingCustomer.name}</strong>?
                  This action will set the customer as inactive but preserve all data.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {state.showProfileModal && state.viewingCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Customer Profile</h3>
                <button
                  onClick={closeProfileModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Name</label>
                      <p className="text-sm text-gray-900">{state.viewingCustomer.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900">{state.viewingCustomer.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-sm text-gray-900">{state.viewingCustomer.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">WhatsApp</label>
                      <p className="text-sm text-gray-900">{state.viewingCustomer.whatsapp_number || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500">Address</label>
                      <p className="text-sm text-gray-900">{state.viewingCustomer.address}</p>
                    </div>
                  </div>
                </div>

                {/* Company Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Company Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Company Name</label>
                      <p className="text-sm text-gray-900">{state.viewingCustomer.company_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Industry</label>
                      <p className="text-sm text-gray-900">{state.viewingCustomer.industry || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Company Size</label>
                      <p className="text-sm text-gray-900">{state.viewingCustomer.company_size || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Business Type</label>
                      <p className="text-sm text-gray-900">{state.viewingCustomer.business_type || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Service Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Service Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Service Tier</label>
                      <p className="text-sm text-gray-900">
                        {state.viewingCustomer.service_tier && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceTierColor(state.viewingCustomer.service_tier)}`}>
                            {state.viewingCustomer.service_tier}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Priority Level</label>
                      <p className="text-sm text-gray-900">
                        {state.viewingCustomer.priority_level && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(state.viewingCustomer.priority_level)}`}>
                            {state.viewingCustomer.priority_level}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Contract Type</label>
                      <p className="text-sm text-gray-900">{state.viewingCustomer.contract_type || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Equipment Count</label>
                      <p className="text-sm text-gray-900">{(state.viewingCustomer as any).equipment_count || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Equipment */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Equipment</h4>
                  {state.customerEquipment && state.customerEquipment.length > 0 ? (
                    <div className="space-y-3">
                      {state.customerEquipment.map((equipment, index) => (
                        <div key={equipment.id || index} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">
                                {equipment.equipment_type?.name || 'Unknown Type'} - {equipment.equipment_type?.brand} {equipment.equipment_type?.model}
                              </h5>
                              <p className="text-sm text-gray-600">Serial: {equipment.serial_number}</p>
                              {equipment.asset_tag && (
                                <p className="text-sm text-gray-600">Asset Tag: {equipment.asset_tag}</p>
                              )}
                              {equipment.location_details && (
                                <p className="text-sm text-gray-600">Location: {equipment.location_details}</p>
                              )}
                              {equipment.purchase_date && (
                                <p className="text-sm text-gray-600">
                                  Purchased: {new Date(equipment.purchase_date).toLocaleDateString()}
                                </p>
                              )}
                              {equipment.warranty_expiry && (
                                <p className="text-sm text-gray-600">
                                  Warranty: {new Date(equipment.warranty_expiry).toLocaleDateString()}
                                </p>
                              )}
                              {equipment.notes && (
                                <p className="text-sm text-gray-600 mt-1">Notes: {equipment.notes}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                equipment.condition === 'good' ? 'bg-green-100 text-green-800' :
                                equipment.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                equipment.condition === 'poor' ? 'bg-orange-100 text-orange-800' :
                                equipment.condition === 'needs_repair' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {equipment.condition}
                              </span>
                              {equipment.installation_date && (
                                <p className="text-xs text-gray-500">
                                  Installed: {new Date(equipment.installation_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <i className="ri-tools-line text-3xl text-gray-400 mb-2"></i>
                      <p className="text-sm text-gray-500">No equipment assigned to this customer.</p>
                    </div>
                  )}
                </div>

                {/* Service History */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-medium text-gray-900">Service History</h4>
                    <span className="text-sm text-gray-500">
                      Total Jobs: {(state.viewingCustomer as any).total_jobs || 0}
                    </span>
                  </div>
                  {(state.viewingCustomer as any).recent_jobs && (state.viewingCustomer as any).recent_jobs.length > 0 ? (
                    <div className="space-y-3">
                      {(state.viewingCustomer as any).recent_jobs.map((job: any, index: number) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h5 className="font-medium text-gray-900">#{job.job_number}</h5>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  job.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {job.status}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  job.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  job.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {job.priority}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900 mt-1">{job.title}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                {job.technician_name && (
                                  <span>Technician: {job.technician_name}</span>
                                )}
                                {job.scheduled_date && (
                                  <span>Scheduled: {new Date(job.scheduled_date).toLocaleDateString()}</span>
                                )}
                                {job.completed_at && (
                                  <span>Completed: {new Date(job.completed_at).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {job.total_cost && (
                                <p className="text-sm font-medium text-gray-900">${job.total_cost}</p>
                              )}
                              {job.rating && (
                                <div className="flex items-center mt-1">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <i
                                      key={i}
                                      className={`ri-star-${i < job.rating ? 'fill' : 'line'} text-yellow-400 text-sm`}
                                    ></i>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {(state.viewingCustomer as any).total_jobs > 10 && (
                        <div className="text-center">
                          <p className="text-sm text-gray-500">
                            Showing 10 most recent jobs. Total: {(state.viewingCustomer as any).total_jobs}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No service history available for this customer.</p>
                  )}
                </div>

                {/* Notes */}
                {state.viewingCustomer.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Notes</h4>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{state.viewingCustomer.notes}</p>
                  </div>
                )}

                {/* Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Status</h4>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      state.viewingCustomer.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {state.viewingCustomer.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-sm text-gray-500">
                      Created: {new Date(state.viewingCustomer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={closeProfileModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    openModal(state.viewingCustomer!);
                    closeProfileModal();
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  Edit Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
