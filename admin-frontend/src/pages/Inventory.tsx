import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { Part, InventoryResponse, InventoryOptions, LowStockAlertsResponse } from '../types';
import InventoryForm from '../components/InventoryForm';

interface InventoryPageState {
  inventoryItems: Part[];
  loading: boolean;
  searchTerm: string;
  categoryFilter: string;
  equipmentTypeFilter: string;
  statusFilter: string;
  lowStockOnly: boolean;
  currentPage: number;
  totalPages: number;
  showModal: boolean;
  showDeleteModal: boolean;
  showStockModal: boolean;
  editingItem: Part | null;
  deletingItem: Part | null;
  stockItem: Part | null;
  activeDropdown: string | null;
  options: InventoryOptions | null;
  lowStockAlerts: LowStockAlertsResponse | null;
}

const Inventory: React.FC = () => {
  const [state, setState] = useState<InventoryPageState>({
    inventoryItems: [],
    loading: true,
    searchTerm: '',
    categoryFilter: '',
    equipmentTypeFilter: '',
    statusFilter: '',
    lowStockOnly: false,
    currentPage: 1,
    totalPages: 1,
    showModal: false,
    showDeleteModal: false,
    showStockModal: false,
    editingItem: null,
    deletingItem: null,
    stockItem: null,
    activeDropdown: null,
    options: null,
    lowStockAlerts: null,
  });

  const [stockFormData, setStockFormData] = useState({
    quantity: 0,
    operation: 'set',
    notes: ''
  });

  useEffect(() => {
    loadInventoryItems();
    loadInventoryOptions();
    loadLowStockAlerts();
  }, [state.currentPage, state.searchTerm, state.categoryFilter, state.equipmentTypeFilter, state.statusFilter, state.lowStockOnly]);

  const loadInventoryItems = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const params: any = {
        page: state.currentPage,
        limit: 10,
      };

      if (state.searchTerm) params.search = state.searchTerm;
      if (state.categoryFilter) params.category = state.categoryFilter;
      if (state.equipmentTypeFilter) params.equipment_type_id = state.equipmentTypeFilter;
      if (state.statusFilter) params.status = state.statusFilter;
      if (state.lowStockOnly) params.low_stock_only = 'true';

      const response = await apiService.get<InventoryResponse>('/inventory', params);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          inventoryItems: response.data?.inventory_items || [],
          totalPages: response.data?.pagination?.totalPages || 1,
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Error loading inventory items:', error);
      toast.error('Failed to load inventory items');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const loadInventoryOptions = async () => {
    try {
      const response = await apiService.get<InventoryOptions>('/inventory/options');
      if (response.success && response.data) {
        setState(prev => ({ ...prev, options: response.data || null }));
      }
    } catch (error) {
      console.error('Error loading inventory options:', error);
    }
  };

  const loadLowStockAlerts = async () => {
    try {
      const response = await apiService.get<LowStockAlertsResponse>('/inventory/alerts');
      if (response.success && response.data) {
        setState(prev => ({ ...prev, lowStockAlerts: response.data || null }));
      }
    } catch (error) {
      console.error('Error loading low stock alerts:', error);
    }
  };

  const handleSearch = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term, currentPage: 1 }));
  }, []);

  const handleFilterChange = (filterType: string, value: string) => {
    setState(prev => ({ 
      ...prev, 
      [filterType]: value, 
      currentPage: 1 
    }));
  };

  const openModal = (item?: Part) => {
    // Refresh options when opening the modal to get latest equipment types
    loadInventoryOptions();
    if (item) {
      setState(prev => ({ ...prev, editingItem: item, showModal: true }));
    } else {
      setState(prev => ({ ...prev, editingItem: null, showModal: true }));
    }
  };

  const closeModal = () => {
    setState(prev => ({ 
      ...prev, 
      showModal: false, 
      editingItem: null 
    }));
  };

  const openDeleteModal = (item: Part) => {
    setState(prev => ({ 
      ...prev, 
      deletingItem: item, 
      showDeleteModal: true 
    }));
  };

  const closeDeleteModal = () => {
    setState(prev => ({ 
      ...prev, 
      showDeleteModal: false, 
      deletingItem: null 
    }));
  };

  const openStockModal = (item: Part) => {
    setState(prev => ({ 
      ...prev, 
      stockItem: item, 
      showStockModal: true 
    }));
    setStockFormData({
      quantity: item.current_stock,
      operation: 'set',
      notes: ''
    });
  };

  const closeStockModal = () => {
    setState(prev => ({
      ...prev,
      showStockModal: false,
      stockItem: null
    }));
    setStockFormData({
      quantity: 0,
      operation: 'set',
      notes: ''
    });
  };



  const handleItemSaved = () => {
    loadInventoryItems();
    loadInventoryOptions();
    loadLowStockAlerts();
    closeModal();
    toast.success(state.editingItem ? 'Inventory item updated successfully' : 'Inventory item created successfully');
  };

  const handleDeleteItem = async () => {
    if (!state.deletingItem) return;

    try {
      const response = await apiService.delete(`/inventory/${state.deletingItem.id}`);
      if (response.success) {
        toast.success('Inventory item deleted successfully');
        loadInventoryItems();
        loadLowStockAlerts();
        closeDeleteModal();
      } else {
        toast.error(response.error || 'Failed to delete inventory item');
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      toast.error('Failed to delete inventory item');
    }
  };

  const handleStockUpdate = async () => {
    if (!state.stockItem) return;

    try {
      const response = await apiService.patch(`/inventory/${state.stockItem.id}/stock`, stockFormData);
      if (response.success) {
        toast.success('Stock level updated successfully');
        loadInventoryItems();
        loadLowStockAlerts();
        closeStockModal();
      } else {
        toast.error(response.error || 'Failed to update stock level');
      }
    } catch (error) {
      console.error('Error updating stock level:', error);
      toast.error('Failed to update stock level');
    }
  };

  const getStockStatusColor = (item: Part) => {
    if (item.current_stock <= 0) return 'text-red-600 bg-red-50';
    if (item.current_stock <= item.min_stock_level) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockStatusText = (item: Part) => {
    if (item.current_stock <= 0) return 'Out of Stock';
    if (item.current_stock <= item.min_stock_level) return 'Low Stock';
    return 'In Stock';
  };

  const toggleDropdown = (itemId: string) => {
    setState(prev => ({ 
      ...prev, 
      activeDropdown: prev.activeDropdown === itemId ? null : itemId 
    }));
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage your parts and inventory stock levels</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
        >
          <i className="ri-add-line"></i>
          <span>Add Item</span>
        </button>
      </div>

      {/* Low Stock Alerts */}
      {state.lowStockAlerts && state.lowStockAlerts.summary.total > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <i className="ri-alert-line text-yellow-600"></i>
              <span className="text-yellow-800 font-medium">
                {state.lowStockAlerts.summary.critical > 0 && (
                  <span className="text-red-600">{state.lowStockAlerts.summary.critical} critical, </span>
                )}
                {state.lowStockAlerts.summary.low} low stock items
              </span>
            </div>
            <button
              onClick={() => setState(prev => ({ ...prev, lowStockOnly: !prev.lowStockOnly }))}
              className="text-yellow-700 hover:text-yellow-800 text-sm font-medium"
            >
              {state.lowStockOnly ? 'Show All' : 'View Low Stock'}
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search by name, part number, or description..."
                value={state.searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={state.categoryFilter}
              onChange={(e) => handleFilterChange('categoryFilter', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Categories</option>
              {state.options?.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Equipment Type Filter */}
          <div>
            <select
              value={state.equipmentTypeFilter}
              onChange={(e) => handleFilterChange('equipmentTypeFilter', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Equipment Types</option>
              {state.options?.equipment_types.map(equipmentType => (
                <option key={equipmentType.id} value={equipmentType.id}>
                  {equipmentType.brand} - {equipmentType.model}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={state.statusFilter}
              onChange={(e) => handleFilterChange('statusFilter', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Status</option>
              {state.options?.statuses.map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category/Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
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
              {state.inventoryItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">#{item.part_number}</div>
                      {item.description && (
                        <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.category || 'Uncategorized'}</div>
                    <div className="text-sm text-gray-500">
                      {item.equipment_type
                        ? `${item.equipment_type.brand} - ${item.equipment_type.model}`
                        : 'No Equipment Type'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{item.current_stock}</span>
                      <span className="text-xs text-gray-500">/ {item.min_stock_level} min</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full ${
                          item.current_stock <= 0 ? 'bg-red-500' :
                          item.current_stock <= item.min_stock_level ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (item.current_stock / Math.max(item.min_stock_level * 2, 1)) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${item.unit_price.toFixed(2)}</div>
                    {item.cost_price && (
                      <div className="text-xs text-gray-500">Cost: ${item.cost_price.toFixed(2)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(item)}`}>
                      {getStockStatusText(item)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(item.id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <i className="ri-more-2-line"></i>
                      </button>

                      {state.activeDropdown === item.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                openModal(item);
                                toggleDropdown(item.id);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <i className="ri-edit-line mr-2"></i>
                              Edit Item
                            </button>
                            <button
                              onClick={() => {
                                openStockModal(item);
                                toggleDropdown(item.id);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <i className="ri-add-box-line mr-2"></i>
                              Update Stock
                            </button>
                            <button
                              onClick={() => {
                                openDeleteModal(item);
                                toggleDropdown(item.id);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <i className="ri-delete-bin-line mr-2"></i>
                              Delete Item
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

        {/* Empty State */}
        {state.inventoryItems.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-box-line text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
            <p className="text-gray-500 mb-4">
              {state.searchTerm || state.categoryFilter || state.equipmentTypeFilter || state.statusFilter
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first inventory item'
              }
            </p>
            {!state.searchTerm && !state.categoryFilter && !state.equipmentTypeFilter && !state.statusFilter && (
              <button
                onClick={() => openModal()}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add First Item
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {state.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setState(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                  disabled={state.currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
                  disabled={state.currentPage === state.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{state.currentPage}</span> of{' '}
                    <span className="font-medium">{state.totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setState(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                      disabled={state.currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="ri-arrow-left-s-line"></i>
                    </button>
                    <button
                      onClick={() => setState(prev => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
                      disabled={state.currentPage === state.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="ri-arrow-right-s-line"></i>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {state.showModal && (
        <InventoryForm
          item={state.editingItem}
          options={state.options}
          onSave={handleItemSaved}
          onCancel={closeModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {state.showDeleteModal && state.deletingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <i className="ri-delete-bin-line text-red-600"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Inventory Item</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete <strong>{state.deletingItem.name}</strong> (#{state.deletingItem.part_number})?
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {state.showStockModal && state.stockItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="ri-add-box-line text-blue-600"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Update Stock Level</h3>
                <p className="text-sm text-gray-500">{state.stockItem.name} (#{state.stockItem.part_number})</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock: {state.stockItem.current_stock}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
                <select
                  value={stockFormData.operation}
                  onChange={(e) => setStockFormData(prev => ({ ...prev, operation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="set">Set to specific amount</option>
                  <option value="add">Add to current stock</option>
                  <option value="subtract">Subtract from current stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={stockFormData.quantity}
                  onChange={(e) => setStockFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={stockFormData.notes}
                  onChange={(e) => setStockFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Reason for stock adjustment..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeStockModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStockUpdate}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {state.activeDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setState(prev => ({ ...prev, activeDropdown: null }))}
        />
      )}
    </div>
  );
};

export default Inventory;
