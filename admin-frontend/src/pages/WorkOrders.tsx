import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { Job, JobsResponse, JobStatus, JobPriority } from '../types';
import WorkOrderModal from '../components/WorkOrderModal';

interface WorkOrdersPageState {
  jobs: Job[];
  loading: boolean;
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
  technicianFilter: string;
  customerFilter: string;
  currentPage: number;
  totalPages: number;
  showModal: boolean;
  showDeleteModal: boolean;
  showDetailsModal: boolean;
  editingJob: Job | null;
  deletingJob: Job | null;
  viewingJob: Job | null;
  activeDropdown: string | null;
}

const WorkOrders: React.FC = () => {
  const [state, setState] = useState<WorkOrdersPageState>({
    jobs: [],
    loading: true,
    searchTerm: '',
    statusFilter: '',
    priorityFilter: '',
    technicianFilter: '',
    customerFilter: '',
    currentPage: 1,
    totalPages: 1,
    showModal: false,
    showDeleteModal: false,
    showDetailsModal: false,
    editingJob: null,
    deletingJob: null,
    viewingJob: null,
    activeDropdown: null,
  });

  // Load jobs on component mount and when filters change
  useEffect(() => {
    loadJobs();
  }, [state.currentPage, state.searchTerm, state.statusFilter, state.priorityFilter, state.technicianFilter, state.customerFilter]);

  const loadJobs = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const params: any = {
        page: state.currentPage,
        limit: 10,
      };
      
      if (state.searchTerm) params.search = state.searchTerm;
      if (state.statusFilter) params.status = state.statusFilter;
      if (state.priorityFilter) params.priority = state.priorityFilter;
      if (state.technicianFilter) params.technician_id = state.technicianFilter;
      if (state.customerFilter) params.customer_id = state.customerFilter;

      const response = await apiService.getJobs(params);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          jobs: response.data?.jobs || [],
          totalPages: response.data?.pagination?.totalPages || 1,
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load work orders');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, searchTerm: e.target.value, currentPage: 1 }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setState(prev => ({ 
      ...prev, 
      [filterType]: value, 
      currentPage: 1,
      activeDropdown: null 
    }));
  };

  const handlePageChange = (page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  };

  const openModal = (job?: Job) => {
    setState(prev => ({ 
      ...prev, 
      editingJob: job || null, 
      showModal: true 
    }));
  };

  const closeModal = () => {
    setState(prev => ({ 
      ...prev, 
      showModal: false, 
      editingJob: null 
    }));
  };

  const openDeleteModal = (job: Job) => {
    setState(prev => ({ 
      ...prev, 
      deletingJob: job, 
      showDeleteModal: true 
    }));
  };

  const closeDeleteModal = () => {
    setState(prev => ({ 
      ...prev, 
      showDeleteModal: false, 
      deletingJob: null 
    }));
  };

  const openDetailsModal = (job: Job) => {
    setState(prev => ({ 
      ...prev, 
      viewingJob: job, 
      showDetailsModal: true 
    }));
  };

  const closeDetailsModal = () => {
    setState(prev => ({ 
      ...prev, 
      showDetailsModal: false, 
      viewingJob: null 
    }));
  };

  const handleDelete = async () => {
    if (!state.deletingJob) return;

    try {
      const response = await apiService.deleteJob(state.deletingJob.id);
      
      if (response.success) {
        toast.success('Work order deleted successfully');
        closeDeleteModal();
        loadJobs();
      } else {
        toast.error(response.error || 'Failed to delete work order');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete work order');
    }
  };

  const updateJobStatus = async (jobId: string, newStatus: JobStatus) => {
    try {
      const response = await apiService.updateJobStatus(jobId, newStatus);
      
      if (response.success) {
        toast.success('Status updated successfully');
        loadJobs();
      } else {
        toast.error(response.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: JobStatus) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      assigned: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Assigned' },
      in_progress: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Progress' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
      on_hold: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'On Hold' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: JobPriority) => {
    const priorityConfig = {
      low: { bg: 'bg-green-100', text: 'text-green-800', label: 'Low' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High' },
      urgent: { bg: 'bg-red-100', text: 'text-red-800', label: 'Urgent' },
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return <span className="text-gray-500">No due date</span>;

    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    dueDate.setHours(0, 0, 0, 0);

    const formattedDate = dueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // Check if overdue
    if (dueDate < today) {
      return (
        <span className="text-red-600 font-medium">
          {formattedDate} (Overdue)
        </span>
      );
    }

    // Check if due today
    if (dueDate.getTime() === today.getTime()) {
      return (
        <span className="text-orange-600 font-medium">
          {formattedDate} (Due Today)
        </span>
      );
    }

    // Check if due within 3 days
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    if (dueDate <= threeDaysFromNow) {
      return (
        <span className="text-yellow-600 font-medium">
          {formattedDate} (Due Soon)
        </span>
      );
    }

    // Normal due date
    return <span className="text-gray-700">{formattedDate}</span>;
  };

  const toggleDropdown = (dropdownId: string) => {
    setState(prev => ({
      ...prev,
      activeDropdown: prev.activeDropdown === dropdownId ? null : dropdownId
    }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-gray-600 mt-1">Manage and track service work orders</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <i className="ri-add-line"></i>
          <span>New Work Order</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search work orders..."
                  value={state.searchTerm}
                  onChange={handleSearch}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 flex items-center justify-center text-gray-400">
                  <i className="ri-search-line"></i>
                </div>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('status')}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span>Status</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                {state.activeDropdown === 'status' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-2">
                      <button
                        onClick={() => handleFilterChange('statusFilter', '')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        All Statuses
                      </button>
                      <button
                        onClick={() => handleFilterChange('statusFilter', 'pending')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => handleFilterChange('statusFilter', 'assigned')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Assigned
                      </button>
                      <button
                        onClick={() => handleFilterChange('statusFilter', 'in_progress')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleFilterChange('statusFilter', 'completed')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Completed
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Priority Filter */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('priority')}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span>Priority</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                {state.activeDropdown === 'priority' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-2">
                      <button
                        onClick={() => handleFilterChange('priorityFilter', '')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        All Priorities
                      </button>
                      <button
                        onClick={() => handleFilterChange('priorityFilter', 'low')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Low
                      </button>
                      <button
                        onClick={() => handleFilterChange('priorityFilter', 'medium')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Medium
                      </button>
                      <button
                        onClick={() => handleFilterChange('priorityFilter', 'high')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        High
                      </button>
                      <button
                        onClick={() => handleFilterChange('priorityFilter', 'urgent')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Urgent
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={loadJobs}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <i className="ri-refresh-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {state.loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading work orders...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Technician
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {state.jobs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        <i className="ri-file-list-line text-4xl mb-4 block"></i>
                        No work orders found
                      </td>
                    </tr>
                  ) : (
                    state.jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {job.job_number}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {job.title}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {job.customer?.name || 'Unknown Customer'}
                          </div>
                          {job.customer?.company_name && (
                            <div className="text-sm text-gray-500">
                              {job.customer.company_name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(job.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPriorityBadge(job.priority)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {job.technician ? (
                            <div className="flex items-center">
                              <img
                                className="h-8 w-8 rounded-full"
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(job.technician.user?.full_name || 'Unknown')}&background=2563eb&color=fff`}
                                alt=""
                              />
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {job.technician.user?.full_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: #{job.technician.employee_id}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(job.scheduled_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatDueDate(job.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openDetailsModal(job)}
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                              title="View Details"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                            <button
                              onClick={() => openModal(job)}
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                              title="Edit"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                            <button
                              onClick={() => openDeleteModal(job)}
                              className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {state.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing page {state.currentPage} of {state.totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(state.currentPage - 1)}
                      disabled={state.currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center space-x-2">
                      {Array.from({ length: Math.min(5, state.totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                              state.currentPage === page
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handlePageChange(state.currentPage + 1)}
                      disabled={state.currentPage === state.totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Work Order Modal */}
      <WorkOrderModal
        isOpen={state.showModal}
        onClose={closeModal}
        onSave={loadJobs}
        editingJob={state.editingJob}
      />

      {/* Delete Confirmation Modal */}
      {state.showDeleteModal && state.deletingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <i className="ri-delete-bin-line text-red-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Delete Work Order
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to delete work order "{state.deletingJob.job_number}"?
                This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {state.showDetailsModal && state.viewingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Work Order Details - {state.viewingJob.job_number}
                </h2>
                <button
                  onClick={closeDetailsModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Priority */}
              <div className="flex items-center space-x-4">
                {getStatusBadge(state.viewingJob.status)}
                {getPriorityBadge(state.viewingJob.priority)}
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Work Order Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Title</label>
                      <p className="text-sm text-gray-900">{state.viewingJob.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Description</label>
                      <p className="text-sm text-gray-900">{state.viewingJob.description}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Scheduled Date</label>
                      <p className="text-sm text-gray-900">{formatDate(state.viewingJob.scheduled_date)}</p>
                    </div>
                    {state.viewingJob.estimated_duration && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Estimated Duration</label>
                        <p className="text-sm text-gray-900">{state.viewingJob.estimated_duration} minutes</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Customer</label>
                      <p className="text-sm text-gray-900">
                        {state.viewingJob.customer?.name || 'Unknown Customer'}
                        {state.viewingJob.customer?.company_name && (
                          <span className="text-gray-500"> ({state.viewingJob.customer.company_name})</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Technician</label>
                      <p className="text-sm text-gray-900">
                        {state.viewingJob.technician?.user?.full_name || 'Unassigned'}
                        {state.viewingJob.technician?.employee_id && (
                          <span className="text-gray-500"> (#{state.viewingJob.technician.employee_id})</span>
                        )}
                      </p>
                    </div>
                    {state.viewingJob.equipment && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Equipment</label>
                        <p className="text-sm text-gray-900">
                          {state.viewingJob.equipment.equipment_type?.brand} {state.viewingJob.equipment.equipment_type?.model}
                          <span className="text-gray-500"> (S/N: {state.viewingJob.equipment.serial_number})</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="w-24 text-gray-500">Created:</span>
                    <span className="text-gray-900">{formatDate(state.viewingJob.created_at)}</span>
                  </div>
                  {state.viewingJob.started_at && (
                    <div className="flex items-center text-sm">
                      <span className="w-24 text-gray-500">Started:</span>
                      <span className="text-gray-900">{formatDate(state.viewingJob.started_at)}</span>
                    </div>
                  )}
                  {state.viewingJob.completed_at && (
                    <div className="flex items-center text-sm">
                      <span className="w-24 text-gray-500">Completed:</span>
                      <span className="text-gray-900">{formatDate(state.viewingJob.completed_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes and Feedback */}
              {(state.viewingJob.technician_notes || state.viewingJob.customer_feedback) && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notes & Feedback</h3>
                  <div className="space-y-4">
                    {state.viewingJob.technician_notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Technician Notes</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {state.viewingJob.technician_notes}
                        </p>
                      </div>
                    )}
                    {state.viewingJob.customer_feedback && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Customer Feedback</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {state.viewingJob.customer_feedback}
                        </p>
                        {state.viewingJob.rating && (
                          <div className="mt-2">
                            <span className="text-sm text-gray-500">Rating: </span>
                            <div className="inline-flex items-center">
                              {Array.from({ length: 5 }, (_, i) => (
                                <i
                                  key={i}
                                  className={`ri-star-${i < (state.viewingJob?.rating || 0) ? 'fill' : 'line'} text-yellow-400`}
                                ></i>
                              ))}
                              <span className="ml-2 text-sm text-gray-600">
                                ({state.viewingJob?.rating}/5)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={closeDetailsModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeDetailsModal();
                    openModal(state.viewingJob!);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Edit Work Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {state.activeDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setState(prev => ({ ...prev, activeDropdown: null }))}
        />
      )}
    </div>
  );
};

export default WorkOrders;
