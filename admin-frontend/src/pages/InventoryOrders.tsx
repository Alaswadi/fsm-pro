import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';

interface InventoryOrder {
  id: string;
  work_order_id: string;
  job_number: string;
  work_order_title: string;
  work_order_status: string;
  customer_name: string;
  part_id: string;
  part_number: string;
  part_name: string;
  part_description: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  ordered_at: string;
  status: string;
  notes: string;
  ordered_by_id: string;
  ordered_by_name: string;
  ordered_by_email: string;
  ordered_by_role: string;
  current_stock: number;
}

interface OrdersSummary {
  total_orders: number;
  total_items: number;
  total_value: number;
  unique_technicians: number;
  unique_parts: number;
  unique_work_orders: number;
}

interface InventoryOrdersResponse {
  orders: InventoryOrder[];
  summary: OrdersSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const InventoryOrders: React.FC = () => {
  const [orders, setOrders] = useState<InventoryOrder[]>([]);
  const [summary, setSummary] = useState<OrdersSummary>({
    total_orders: 0,
    total_items: 0,
    total_value: 0,
    unique_technicians: 0,
    unique_parts: 0,
    unique_work_orders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<InventoryOrder | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [processingStatus, setProcessingStatus] = useState(false);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, dateFrom, dateTo, statusFilter, technicianFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: currentPage,
        limit: 50,
      };

      if (searchTerm) params.search = searchTerm;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (statusFilter) params.status = statusFilter;
      if (technicianFilter) params.technician_id = technicianFilter;

      const response = await apiService.getInventoryOrders(params);

      if (response.success && response.data) {
        const data = response.data as InventoryOrdersResponse;
        setOrders(data.orders || []);
        setSummary(data.summary || {
          total_orders: 0,
          total_items: 0,
          total_value: 0,
          unique_technicians: 0,
          unique_parts: 0,
          unique_work_orders: 0,
        });
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error loading inventory orders:', error);
      toast.error('Failed to load inventory orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadOrders();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setTechnicianFilter('');
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = [
      'Order Date',
      'Work Order',
      'Customer',
      'Part Number',
      'Part Name',
      'Category',
      'Quantity',
      'Unit Price',
      'Total Price',
      'Ordered By',
      'Status',
    ];

    const rows = orders.map(order => [
      new Date(order.ordered_at).toLocaleString(),
      order.job_number,
      order.customer_name || 'N/A',
      order.part_number,
      order.part_name,
      order.category || 'N/A',
      order.quantity,
      `$${order.unit_price.toFixed(2)}`,
      `$${order.total_price.toFixed(2)}`,
      order.ordered_by_name,
      order.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (statusFilter) params.status = statusFilter;
      if (technicianFilter) params.technician_id = technicianFilter;

      const blob = await apiService.exportInventoryOrdersPDF(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-orders-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleStatusChange = (order: InventoryOrder, status: string) => {
    setSelectedOrder(order);
    setNewStatus(status);
    setStatusNotes('');
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedOrder) return;

    try {
      setProcessingStatus(true);
      const response = await apiService.updateInventoryOrderStatus(
        selectedOrder.id,
        newStatus,
        statusNotes
      );

      if (response.success) {
        toast.success(`Order ${newStatus} successfully`);
        setShowStatusModal(false);
        setSelectedOrder(null);
        setStatusNotes('');
        loadOrders(); // Reload orders
      } else {
        toast.error(response.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setProcessingStatus(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ordered':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Orders Audit Report</h1>
        <p className="text-gray-600 mt-2">Track all inventory orders by technicians</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900">{summary.total_orders}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-gray-900">{summary.total_items}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_value)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Technicians</div>
          <div className="text-2xl font-bold text-gray-900">{summary.unique_technicians}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Unique Parts</div>
          <div className="text-2xl font-bold text-gray-900">{summary.unique_parts}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Work Orders</div>
          <div className="text-2xl font-bold text-gray-900">{summary.unique_work_orders}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Part, technician, work order..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="ordered">Ordered</option>
                <option value="accepted">Accepted</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Export Buttons */}
      <div className="mb-4 flex justify-end gap-3">
        <button
          onClick={exportToCSV}
          disabled={orders.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <i className="ri-file-excel-line"></i>
          Export to CSV
        </button>
        <button
          onClick={exportToPDF}
          disabled={orders.length === 0}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <i className="ri-file-pdf-line"></i>
          Export to PDF
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <i className="ri-inbox-line text-4xl mb-2"></i>
            <p>No inventory orders found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Part
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ordered By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(order.ordered_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.job_number}</div>
                        <div className="text-sm text-gray-500">{order.customer_name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{order.part_name}</div>
                        <div className="text-sm text-gray-500">{order.part_number}</div>
                        {order.category && (
                          <div className="text-xs text-gray-400">{order.category}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(order.total_price)}</div>
                        <div className="text-xs text-gray-500">{formatCurrency(order.unit_price)}/unit</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.ordered_by_name}</div>
                        <div className="text-xs text-gray-500">{order.ordered_by_role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {order.status === 'ordered' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(order, 'accepted')}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                                title="Accept Order"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleStatusChange(order, 'cancelled')}
                                className="text-red-600 hover:text-red-800 font-medium"
                                title="Cancel Order"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {order.status === 'accepted' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(order, 'delivered')}
                                className="text-green-600 hover:text-green-800 font-medium"
                                title="Mark as Delivered"
                              >
                                Deliver
                              </button>
                              <button
                                onClick={() => handleStatusChange(order, 'cancelled')}
                                className="text-red-600 hover:text-red-800 font-medium"
                                title="Cancel Order"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {(order.status === 'delivered' || order.status === 'cancelled') && (
                            <span className="text-gray-400 text-xs">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status Change Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {newStatus === 'accepted' && 'Accept Order'}
              {newStatus === 'delivered' && 'Deliver Order'}
              {newStatus === 'cancelled' && 'Cancel Order'}
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Part:</strong> {selectedOrder.part_name} ({selectedOrder.part_number})
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Quantity:</strong> {selectedOrder.quantity}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Work Order:</strong> {selectedOrder.job_number}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Ordered By:</strong> {selectedOrder.ordered_by_name}
              </p>
            </div>

            {newStatus === 'delivered' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <i className="ri-alert-line mr-1"></i>
                  This will deduct {selectedOrder.quantity} units from inventory stock.
                </p>
              </div>
            )}

            {newStatus === 'cancelled' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800">
                  <i className="ri-alert-line mr-1"></i>
                  This order will be cancelled and cannot be processed.
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any notes about this status change..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedOrder(null);
                  setStatusNotes('');
                }}
                disabled={processingStatus}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={processingStatus}
                className={`px-4 py-2 rounded-md text-white disabled:opacity-50 ${
                  newStatus === 'accepted' ? 'bg-blue-600 hover:bg-blue-700' :
                  newStatus === 'delivered' ? 'bg-green-600 hover:bg-green-700' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processingStatus ? (
                  <span className="flex items-center gap-2">
                    <i className="ri-loader-4-line animate-spin"></i>
                    Processing...
                  </span>
                ) : (
                  `Confirm ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryOrders;

