import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { workshopService, WorkshopQueueItem } from '../services/workshopService';
import { useAuthStore } from '../stores/authStore';
import { formatDistanceToNow } from 'date-fns';

interface WorkshopQueueState {
  queueItems: WorkshopQueueItem[];
  loading: boolean;
  priorityFilter: string;
  equipmentTypeFilter: string;
  customerFilter: string;
  searchTerm: string;
  capacityUtilization: number;
  currentJobs: number;
  maxJobs: number;
  showClaimModal: boolean;
  claimingJob: WorkshopQueueItem | null;
  activeDropdown: string | null;
  technicianWorkload: number;
  maxJobsPerTechnician: number;
}

const WorkshopQueue: React.FC = () => {
  const { user } = useAuthStore();
  const [state, setState] = useState<WorkshopQueueState>({
    queueItems: [],
    loading: true,
    priorityFilter: '',
    equipmentTypeFilter: '',
    customerFilter: '',
    searchTerm: '',
    capacityUtilization: 0,
    currentJobs: 0,
    maxJobs: 0,
    showClaimModal: false,
    claimingJob: null,
    activeDropdown: null,
    technicianWorkload: 0,
    maxJobsPerTechnician: 5,
  });

  useEffect(() => {
    loadQueue();
    loadTechnicianWorkload();
  }, [state.priorityFilter, state.equipmentTypeFilter, state.customerFilter]);

  const loadTechnicianWorkload = async () => {
    if (user?.role !== 'technician') return;

    try {
      // Get current technician's active jobs count
      const response = await workshopService.getWorkshopJobs({
        status: 'in_progress',
        page: 1,
        limit: 100,
      });

      if (response.success && response.data) {
        const technicianJobs = response.data.jobs.filter(
          (job: any) => job.technician_id === user.id
        );
        setState(prev => ({
          ...prev,
          technicianWorkload: technicianJobs.length,
        }));
      }
    } catch (error) {
      console.error('Error loading technician workload:', error);
    }
  };

  const loadQueue = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const params: any = {};
      if (state.priorityFilter) params.priority = state.priorityFilter;
      if (state.equipmentTypeFilter) params.equipment_type = state.equipmentTypeFilter;
      if (state.customerFilter) params.customer = state.customerFilter;

      const response = await workshopService.getWorkshopQueue(params);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          queueItems: response.data?.jobs || [],
          capacityUtilization: response.data?.capacity_utilization || 0,
          currentJobs: response.data?.current_jobs || 0,
          maxJobs: response.data?.max_jobs || 0,
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Error loading workshop queue:', error);
      toast.error('Failed to load workshop queue');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, searchTerm: e.target.value }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setState(prev => ({
      ...prev,
      [filterType]: value,
      activeDropdown: null,
    }));
  };

  const openClaimModal = (job: WorkshopQueueItem) => {
    setState(prev => ({
      ...prev,
      claimingJob: job,
      showClaimModal: true,
    }));
  };

  const closeClaimModal = () => {
    setState(prev => ({
      ...prev,
      showClaimModal: false,
      claimingJob: null,
    }));
  };

  const handleClaimJob = async () => {
    if (!state.claimingJob) return;

    try {
      const response = await workshopService.claimJob(state.claimingJob.id);

      if (response.success) {
        toast.success('Job claimed successfully');
        closeClaimModal();
        loadQueue();
        loadTechnicianWorkload();
      } else {
        toast.error(response.error || 'Failed to claim job');
      }
    } catch (error: any) {
      console.error('Error claiming job:', error);
      toast.error(error.response?.data?.error || 'Failed to claim job');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending_intake: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending Intake' },
      in_transit: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Transit' },
      received: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Received' },
      in_repair: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Repair' },
      repair_completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Repair Completed' },
      ready_for_pickup: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Ready for Pickup' },
      out_for_delivery: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Out for Delivery' },
      returned: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Returned' },
    };

    const config = statusConfig[status] || statusConfig.received;

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const calculateDaysWaiting = (intakeDate: string) => {
    const intake = new Date(intakeDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - intake.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCapacityColor = () => {
    if (state.capacityUtilization >= 90) return 'text-red-600';
    if (state.capacityUtilization >= 75) return 'text-orange-600';
    if (state.capacityUtilization >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const toggleDropdown = (dropdownId: string) => {
    setState(prev => ({
      ...prev,
      activeDropdown: prev.activeDropdown === dropdownId ? null : dropdownId,
    }));
  };

  // Filter queue items by search term
  const filteredQueueItems = state.queueItems.filter(item => {
    if (!state.searchTerm) return true;
    const searchLower = state.searchTerm.toLowerCase();
    return (
      item.job_number.toLowerCase().includes(searchLower) ||
      item.customer?.name.toLowerCase().includes(searchLower) ||
      item.equipment?.equipment_type?.name.toLowerCase().includes(searchLower) ||
      item.equipment_intake?.reported_issue.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workshop Queue</h1>
          <p className="text-gray-600 mt-1">Manage equipment waiting for repair</p>
        </div>
        <button
          onClick={loadQueue}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <i className="ri-refresh-line"></i>
          <span>Refresh</span>
        </button>
      </div>

      {/* Capacity Utilization Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Workshop Capacity</h3>
            <p className="text-sm text-gray-600">
              {state.currentJobs} of {state.maxJobs} jobs in progress
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getCapacityColor()}`}>
              {state.capacityUtilization.toFixed(0)}%
            </div>
            <p className="text-sm text-gray-600 mt-1">Utilization</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                state.capacityUtilization >= 90
                  ? 'bg-red-600'
                  : state.capacityUtilization >= 75
                  ? 'bg-orange-500'
                  : state.capacityUtilization >= 50
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(state.capacityUtilization, 100)}%` }}
            ></div>
          </div>
        </div>
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
                  placeholder="Search queue..."
                  value={state.searchTerm}
                  onChange={handleSearch}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 flex items-center justify-center text-gray-400">
                  <i className="ri-search-line"></i>
                </div>
              </div>

              {/* Priority Filter */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('priority')}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span>{state.priorityFilter ? state.priorityFilter.charAt(0).toUpperCase() + state.priorityFilter.slice(1) : 'Priority'}</span>
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
                        onClick={() => handleFilterChange('priorityFilter', 'urgent')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Urgent
                      </button>
                      <button
                        onClick={() => handleFilterChange('priorityFilter', 'high')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        High
                      </button>
                      <button
                        onClick={() => handleFilterChange('priorityFilter', 'medium')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Medium
                      </button>
                      <button
                        onClick={() => handleFilterChange('priorityFilter', 'low')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Low
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {state.loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading workshop queue...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Waiting
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQueueItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <i className="ri-inbox-line text-4xl mb-4 block"></i>
                      {state.searchTerm ? 'No matching items found' : 'No equipment in queue'}
                    </td>
                  </tr>
                ) : (
                  filteredQueueItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.job_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.customer?.name || 'Unknown'}
                        </div>
                        {item.customer?.company_name && (
                          <div className="text-sm text-gray-500">
                            {item.customer.company_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.equipment?.equipment_type ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.equipment.equipment_type.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.equipment.equipment_type.brand} {item.equipment.equipment_type.model}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No equipment</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {item.equipment_intake?.reported_issue || 'No issue reported'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.equipment_status?.current_status
                          ? getStatusBadge(item.equipment_status.current_status)
                          : <span className="text-sm text-gray-500">No status</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(item.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.equipment_intake?.intake_date ? (
                          <div className="text-sm text-gray-900">
                            {calculateDaysWaiting(item.equipment_intake.intake_date)} days
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!item.technician_id && user?.role === 'technician' && (
                          <button
                            onClick={() => openClaimModal(item)}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Claim Job
                          </button>
                        )}
                        {item.technician_id && (
                          <span className="text-sm text-gray-500">
                            Assigned to {item.technician?.user?.full_name || 'Technician'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Claim Job Confirmation Modal */}
      {state.showClaimModal && state.claimingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
                <i className="ri-hand-coin-line text-blue-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Claim Job
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to claim job "{state.claimingJob.job_number}"?
                This will assign the job to you and update the equipment status to "In Repair".
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium text-gray-900">{state.claimingJob.customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Equipment:</span>
                    <span className="font-medium text-gray-900">
                      {state.claimingJob.equipment?.equipment_type?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <span>{getPriorityBadge(state.claimingJob.priority)}</span>
                  </div>
                </div>
              </div>
              {user?.role === 'technician' && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Your Current Workload</p>
                      <p className="text-xs text-blue-700 mt-1">
                        {state.technicianWorkload} of {state.maxJobsPerTechnician} jobs
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        state.technicianWorkload >= state.maxJobsPerTechnician
                          ? 'text-red-600'
                          : state.technicianWorkload >= state.maxJobsPerTechnician * 0.8
                          ? 'text-orange-600'
                          : 'text-blue-600'
                      }`}>
                        {state.technicianWorkload}
                      </div>
                    </div>
                  </div>
                  {state.technicianWorkload >= state.maxJobsPerTechnician && (
                    <div className="mt-3 flex items-start space-x-2">
                      <i className="ri-alert-line text-red-600 mt-0.5"></i>
                      <p className="text-xs text-red-700">
                        You are at maximum capacity. Claiming this job may affect your performance.
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={closeClaimModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClaimJob}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Claim Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkshopQueue;
