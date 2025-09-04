import React, { useEffect, useState } from 'react';
import { DashboardStats } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    activeWorkOrders: 247,
    availableTechnicians: 18,
    completionRate: 94.2,
    monthlyRevenue: 84200,
    workOrderTrend: 12,
    technicianTrend: 0,
    completionTrend: 2.1,
    revenueTrend: 8.5,
  });

  const [recentActivities] = useState([
    {
      id: 1,
      type: 'completed',
      icon: 'ri-check-line',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      title: 'Work Order #WO-2024-1247 completed',
      subtitle: 'Technician: Michael Rodriguez • 15 minutes ago',
    },
    {
      id: 2,
      type: 'created',
      icon: 'ri-add-line',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: 'New work order created for Johnson Manufacturing',
      subtitle: 'Priority: High • 32 minutes ago',
    },
    {
      id: 3,
      type: 'alert',
      icon: 'ri-alert-line',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      title: 'Low inventory alert: Hydraulic pump seals',
      subtitle: 'Only 3 units remaining • 1 hour ago',
    },
    {
      id: 4,
      type: 'assigned',
      icon: 'ri-user-add-line',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      title: 'New technician Sarah Chen assigned to North Region',
      subtitle: 'Specialization: HVAC Systems • 2 hours ago',
    },
    {
      id: 5,
      type: 'feedback',
      icon: 'ri-star-line',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      title: 'Customer feedback received: 5-star rating',
      subtitle: 'Atlantic Industries • 3 hours ago',
    },
  ]);

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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* Charts and Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Work Order Status Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Work Order Status</h3>
            <button className="text-sm text-primary hover:text-blue-700">View All</button>
          </div>
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <i className="ri-pie-chart-line text-4xl text-gray-400 mb-2"></i>
              <p className="text-gray-500">Chart will be implemented with Chart.js</p>
            </div>
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
              <p className="text-sm font-medium text-gray-900">18 Active Technicians</p>
              <p className="text-xs text-gray-500">Last updated 2 min ago</p>
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
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className={`w-8 h-8 ${activity.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <div className={`w-4 h-4 flex items-center justify-center ${activity.iconColor}`}>
                    <i className={activity.icon}></i>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Alerts</h3>
            <button className="text-sm text-primary hover:text-blue-700">Manage</button>
          </div>
          <div className="space-y-4">
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-red-900">Critical Low Stock</p>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">3 items</span>
              </div>
              <p className="text-xs text-red-700">Hydraulic pump seals, Motor bearings, Control valves</p>
            </div>
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-orange-900">Low Stock Warning</p>
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">7 items</span>
              </div>
              <p className="text-xs text-orange-700">Electrical components, Safety equipment</p>
            </div>
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-green-900">Auto-Reorder Triggered</p>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">5 orders</span>
              </div>
              <p className="text-xs text-green-700">Expected delivery in 2-3 business days</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button className="w-full bg-primary text-white py-2 px-4 rounded-button font-medium hover:bg-blue-700 transition-colors whitespace-nowrap">
              Create Purchase Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
