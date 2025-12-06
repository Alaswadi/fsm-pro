import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DashboardStats, LowStockAlertsResponse, RecentActivity } from '../types';
import { apiService } from '../services/api';

interface WorkOrderStatusBreakdown {
  status: string;
  count: number;
  color: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    activeWorkOrders: 0,
    availableTechnicians: 0,
    totalCustomers: 0,
    totalEquipment: 0,
    completionRate: 0,
    monthlyRevenue: 0,
    workOrderTrend: 0,
    technicianTrend: 0,
    completionTrend: 0,
    revenueTrend: 0,
    overdueWorkOrders: 0,
    equipmentNeedingMaintenance: 0,
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlertsResponse | null>(null);
  const [workOrderStatusData, setWorkOrderStatusData] = useState<WorkOrderStatusBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Load dashboard stats
      const statsResponse = await apiService.getDashboardStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Load recent activities
      const activitiesResponse = await apiService.getRecentActivities(5);
      if (activitiesResponse.success && activitiesResponse.data) {
        setRecentActivities(activitiesResponse.data);
      }

      // Load work order status breakdown
      setChartLoading(true);
      const statusResponse = await apiService.getWorkOrderStatusBreakdown();
      if (statusResponse.success && statusResponse.data) {
        setWorkOrderStatusData(statusResponse.data);
      }
      setChartLoading(false);

      setLastUpdated(new Date());
      setSystemStatus('healthy');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setSystemStatus('error');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInventoryAlerts = useCallback(async () => {
    try {
      setInventoryLoading(true);

      // Load low stock alerts
      const alertsResponse = await apiService.get<LowStockAlertsResponse>('/inventory/alerts');
      if (alertsResponse.success && alertsResponse.data) {
        setLowStockAlerts(alertsResponse.data);
      }
    } catch (error) {
      console.error('Error loading inventory alerts:', error);
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    loadInventoryAlerts();
  }, [loadDashboardData, loadInventoryAlerts]);

  useEffect(() => {
    if (autoRefresh) {
      const dashboardInterval = setInterval(loadDashboardData, 5 * 60 * 1000); // 5 minutes
      const inventoryInterval = setInterval(loadInventoryAlerts, 5 * 60 * 1000); // 5 minutes
      setRefreshInterval(dashboardInterval);

      return () => {
        clearInterval(dashboardInterval);
        clearInterval(inventoryInterval);
      };
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, loadDashboardData, loadInventoryAlerts]);

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Manual refresh function
  const handleRefresh = () => {
    loadDashboardData();
    loadInventoryAlerts();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTrend = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value}%`;
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="p-6">
      {/* Header with refresh controls */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            {autoRefresh && <span className="text-green-600">• Auto-refresh enabled</span>}
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${systemStatus === 'healthy' ? 'bg-green-500' :
                systemStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
              <span className={
                systemStatus === 'healthy' ? 'text-green-600' :
                  systemStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }>
                System {systemStatus === 'healthy' ? 'Healthy' : systemStatus === 'warning' ? 'Warning' : 'Error'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleAutoRefresh}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${autoRefresh
              ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
          >
            <i className={`ri-time-line ${autoRefresh ? 'text-green-600' : 'text-gray-500'}`}></i>
            <span className="text-sm">Auto-refresh</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        {/* Active Work Orders */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Work Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeWorkOrders}</p>
              <p className={`text-sm mt-2 ${getTrendColor(stats.workOrderTrend)}`}>
                {formatTrend(stats.workOrderTrend)} from last week
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 flex items-center justify-center text-blue-600">
                <i className="ri-file-list-line"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Available Technicians */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Technicians</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.availableTechnicians}</p>
              <p className="text-sm text-gray-500 mt-2">Out of 24 total</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 flex items-center justify-center text-green-600">
                <i className="ri-user-settings-line"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completionRate}%</p>
              <p className={`text-sm mt-2 ${getTrendColor(stats.completionTrend)}`}>
                {formatTrend(stats.completionTrend)} improvement
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 flex items-center justify-center text-purple-600">
                <i className="ri-check-line"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCustomers}</p>
              <p className="text-sm mt-2 text-gray-500">Active customers</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 flex items-center justify-center text-indigo-600">
                <i className="ri-user-line"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Total Equipment */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Equipment</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEquipment}</p>
              <p className="text-sm mt-2 text-gray-500">
                {stats.equipmentNeedingMaintenance > 0 && (
                  <span className="text-orange-600">
                    {stats.equipmentNeedingMaintenance} need maintenance
                  </span>
                )}
                {stats.equipmentNeedingMaintenance === 0 && (
                  <span className="text-green-600">All up to date</span>
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 flex items-center justify-center text-teal-600">
                <i className="ri-tools-line"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue This Month */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.monthlyRevenue)}</p>
              <p className={`text-sm mt-2 ${getTrendColor(stats.revenueTrend)}`}>
                {formatTrend(stats.revenueTrend)} vs last month
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 flex items-center justify-center text-orange-600">
                <i className="ri-money-dollar-circle-line"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(stats.overdueWorkOrders > 0 || stats.equipmentNeedingMaintenance > 0) && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.overdueWorkOrders > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <i className="ri-alert-line text-red-600"></i>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800">
                      {stats.overdueWorkOrders} Overdue Work Orders
                    </h4>
                    <p className="text-xs text-red-600">Require immediate attention</p>
                  </div>
                  <button
                    onClick={() => navigate('/work-orders?status=overdue')}
                    className="ml-auto text-xs text-red-700 hover:text-red-800 font-medium"
                  >
                    View →
                  </button>
                </div>
              </div>
            )}

            {stats.equipmentNeedingMaintenance > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <i className="ri-tools-line text-orange-600"></i>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-orange-800">
                      {stats.equipmentNeedingMaintenance} Equipment Need Maintenance
                    </h4>
                    <p className="text-xs text-orange-600">Schedule maintenance soon</p>
                  </div>
                  <button
                    onClick={() => navigate('/equipment?filter=maintenance')}
                    className="ml-auto text-xs text-orange-700 hover:text-orange-800 font-medium"
                  >
                    View →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/work-orders/new')}
            className="flex items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
              <i className="ri-add-line text-blue-600"></i>
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-gray-900">New Work Order</p>
              <p className="text-xs text-gray-500">Create work order</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/customers/new')}
            className="flex items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200">
              <i className="ri-user-add-line text-green-600"></i>
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-gray-900">Add Customer</p>
              <p className="text-xs text-gray-500">Register new customer</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/technicians')}
            className="flex items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
              <i className="ri-user-settings-line text-purple-600"></i>
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-gray-900">Manage Technicians</p>
              <p className="text-xs text-gray-500">View availability</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/work-orders?priority=urgent')}
            className="flex items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200">
              <i className="ri-alarm-warning-line text-red-600"></i>
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-gray-900">Urgent Tasks</p>
              <p className="text-xs text-gray-500">High priority items</p>
            </div>
          </button>
        </div>
      </div>

      {/* Charts and Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Work Order Status Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Work Order Status</h3>
            <button
              onClick={() => navigate('/work-orders')}
              className="text-sm text-primary hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="h-80">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : workOrderStatusData.length > 0 && workOrderStatusData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workOrderStatusData.filter(d => d.count > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count, percent }) =>
                      `${status}: ${count} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {workOrderStatusData.filter(d => d.count > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number, name: string) => [value, 'Count']}
                    labelFormatter={(label) => `Status: ${label}`}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <i className="ri-inbox-line text-4xl text-gray-400 mb-2"></i>
                  <p className="text-gray-500">No work orders found</p>
                  <button
                    onClick={() => navigate('/work-orders/new')}
                    className="mt-3 text-sm text-primary hover:text-blue-700 font-medium"
                  >
                    Create your first work order →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technician Locations */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Technician Locations</h3>
            <button className="text-sm text-primary hover:text-blue-700">Full Map</button>
          </div>
          <div className="h-80 bg-gray-100 rounded-lg relative overflow-hidden">
            <div className="w-full h-full bg-center bg-cover flex items-center justify-center">
              <div className="text-center">
                <i className="ri-map-pin-line text-4xl text-gray-400 mb-2"></i>
                <p className="text-gray-500">Map integration coming soon</p>
              </div>
            </div>
            <div className="absolute top-4 left-4 bg-white rounded-lg p-3 shadow-sm">
              <p className="text-sm font-medium text-gray-900">{stats.availableTechnicians} Available Technicians</p>
              <p className="text-xs text-gray-500">Last updated {lastUpdated.toLocaleTimeString()}</p>
            </div>

            {/* Status indicators */}
            <div className="absolute bottom-4 left-4 space-y-2">
              <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">{stats.availableTechnicians} Available</span>
              </div>
              {stats.overdueWorkOrders > 0 && (
                <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">{stats.overdueWorkOrders} Overdue</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities and Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            <button className="text-sm text-primary hover:text-blue-700">View All</button>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className={`w-8 h-8 ${activity.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <div className={`w-4 h-4 flex items-center justify-center ${activity.iconColor}`}>
                      <i className={activity.icon}></i>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.subtitle} • {activity.relativeTime}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <i className="ri-history-line text-3xl text-gray-400 mb-2"></i>
                <p className="text-gray-500">No recent activities</p>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Alerts</h3>
            <button
              onClick={() => navigate('/inventory')}
              className="text-sm text-primary hover:text-blue-700"
            >
              Manage
            </button>
          </div>

          {inventoryLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : lowStockAlerts ? (
            <div className="space-y-4">
              {lowStockAlerts.summary.critical > 0 && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-red-900">Critical Low Stock</p>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      {lowStockAlerts.summary.critical} items
                    </span>
                  </div>
                  <p className="text-xs text-red-700">
                    {lowStockAlerts.alerts
                      .filter(alert => alert.alert_level === 'critical')
                      .slice(0, 3)
                      .map(alert => alert.name)
                      .join(', ')}
                    {lowStockAlerts.alerts.filter(alert => alert.alert_level === 'critical').length > 3 && '...'}
                  </p>
                </div>
              )}

              {lowStockAlerts.summary.low > 0 && (
                <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-yellow-900">Low Stock</p>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      {lowStockAlerts.summary.low} items
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700">
                    {lowStockAlerts.alerts
                      .filter(alert => alert.alert_level === 'low')
                      .slice(0, 3)
                      .map(alert => alert.name)
                      .join(', ')}
                    {lowStockAlerts.alerts.filter(alert => alert.alert_level === 'low').length > 3 && '...'}
                  </p>
                </div>
              )}

              {lowStockAlerts.summary.total === 0 && (
                <div className="text-center py-4">
                  <i className="ri-check-line text-2xl text-green-500 mb-2"></i>
                  <p className="text-sm text-gray-600">All inventory levels are good</p>
                </div>
              )}

              <div className="text-center pt-4">
                <button
                  onClick={() => navigate('/inventory')}
                  className="text-sm text-primary hover:text-blue-700 font-medium"
                >
                  View All Inventory →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="ri-package-line text-3xl text-gray-400 mb-2"></i>
              <p className="text-gray-500">No inventory data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
