import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { metricsService } from '../services/metricsService';
import type { WorkshopMetrics, EquipmentRepairStatus } from '../types/workshop';

interface DateRange {
  date_from: string;
  date_to: string;
}

const WorkshopMetricsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<WorkshopMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
      date_from: thirtyDaysAgo.toISOString().split('T')[0],
      date_to: today.toISOString().split('T')[0],
    };
  });

  const loadMetrics = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await metricsService.getWorkshopMetrics(dateRange);

      if (response.success && response.data) {
        setMetrics(response.data);
        setLastUpdated(new Date());

        if (isManualRefresh) {
          toast.success('Metrics updated', {
            duration: 2000,
            icon: '🔄',
          });
        }
      } else {
        toast.error(response.error || 'Failed to load workshop metrics');
      }
    } catch (error) {
      console.error('Error loading workshop metrics:', error);
      toast.error('Failed to load workshop metrics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange]);

  // Initial load and when date range changes
  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const handleManualRefresh = () => {
    loadMetrics(true);
  };

  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return 'Never';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  const handleDateChange = (field: keyof DateRange, value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatHours = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    return `${hours.toFixed(1)} hrs`;
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  const getStatusLabel = (status: EquipmentRepairStatus): string => {
    const labels: Record<EquipmentRepairStatus, string> = {
      pending_intake: 'Pending Intake',
      in_transit: 'In Transit',
      received: 'Received',
      in_repair: 'In Repair',
      repair_completed: 'Repair Completed',
      ready_for_pickup: 'Ready for Pickup',
      out_for_delivery: 'Out for Delivery',
      returned: 'Returned',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: EquipmentRepairStatus): string => {
    const colors: Record<EquipmentRepairStatus, string> = {
      pending_intake: 'bg-gray-100 text-gray-700',
      in_transit: 'bg-blue-100 text-blue-700',
      received: 'bg-yellow-100 text-yellow-700',
      in_repair: 'bg-orange-100 text-orange-700',
      repair_completed: 'bg-green-100 text-green-700',
      ready_for_pickup: 'bg-purple-100 text-purple-700',
      out_for_delivery: 'bg-indigo-100 text-indigo-700',
      returned: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Loading workshop metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600">No metrics data available</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workshop Metrics</h1>
            <p className="text-gray-600 mt-1">Performance analytics and key metrics for workshop operations</p>
          </div>

          {/* Last Updated Indicator */}
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              <i className="ri-time-line mr-1"></i>
              Updated {formatLastUpdated(lastUpdated)}
            </div>
          )}
        </div>
      </div>

      {/* Date Range Selector and Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={dateRange.date_from}
                onChange={(e) => handleDateChange('date_from', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={dateRange.date_to}
                onChange={(e) => handleDateChange('date_to', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Manual refresh button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className={`ri-refresh-line mr-2 ${isRefreshing ? 'animate-spin' : ''}`}></i>
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Jobs */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-300 ${
          isRefreshing ? 'ring-2 ring-blue-200 scale-[1.02]' : ''
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2 transition-all duration-300">
                {metrics.total_jobs}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-tools-line text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>

        {/* Average Repair Time */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-300 ${
          isRefreshing ? 'ring-2 ring-orange-200 scale-[1.02]' : ''
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Repair Time</p>
              <p className="text-3xl font-bold text-gray-900 mt-2 transition-all duration-300">
                {formatHours(metrics.average_repair_time_hours)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-time-line text-2xl text-orange-600"></i>
            </div>
          </div>
        </div>

        {/* On-Time Completion Rate */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-300 ${
          isRefreshing ? 'ring-2 ring-green-200 scale-[1.02]' : ''
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2 transition-all duration-300">
                {formatPercentage(metrics.on_time_completion_rate)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-check-double-line text-2xl text-green-600"></i>
            </div>
          </div>
        </div>

        {/* Capacity Utilization */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-300 ${
          isRefreshing ? 'ring-2 ring-purple-200 scale-[1.02]' : ''
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Capacity Utilization</p>
              <p className="text-3xl font-bold text-gray-900 mt-2 transition-all duration-300">
                {formatPercentage(metrics.current_capacity_utilization)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-dashboard-line text-2xl text-purple-600"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs by Status Chart */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-300 ${
          isRefreshing ? 'ring-2 ring-blue-200' : ''
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Jobs by Status</h2>
            {isRefreshing && (
              <i className="ri-refresh-line text-blue-600 animate-spin"></i>
            )}
          </div>
          <div className="space-y-3">
            {Object.entries(metrics.jobs_by_status).map(([status, count]) => {
              const statusKey = status as EquipmentRepairStatus;
              const percentage = metrics.total_jobs > 0 ? (count / metrics.total_jobs) * 100 : 0;

              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(statusKey)}`}>
                      {getStatusLabel(statusKey)}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 transition-all duration-300">
                      {count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Jobs per Technician Table */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-300 ${
          isRefreshing ? 'ring-2 ring-blue-200' : ''
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Jobs per Technician</h2>
            {isRefreshing && (
              <i className="ri-refresh-line text-blue-600 animate-spin"></i>
            )}
          </div>
          {metrics.jobs_per_technician.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Technician</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Active Jobs</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.jobs_per_technician.map((tech) => (
                    <tr key={tech.technician_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2 text-sm text-gray-900">{tech.technician_name}</td>
                      <td className="py-3 px-2 text-sm text-gray-900 text-right">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-semibold transition-all duration-300">
                          {tech.active_jobs}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="ri-user-line text-4xl mb-2"></i>
              <p>No technician data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkshopMetricsPage;
