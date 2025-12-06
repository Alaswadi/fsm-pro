import React, { useEffect, useState, useCallback } from 'react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    WorkOrderTrend,
    RevenueTrend,
    TechnicianPerformance,
    TopCustomer,
    EquipmentAnalytics
} from '../types';
import { apiService } from '../services/api';

const Analytics: React.FC = () => {
    const [workOrderTrends, setWorkOrderTrends] = useState<WorkOrderTrend[]>([]);
    const [revenueTrends, setRevenueTrends] = useState<RevenueTrend[]>([]);
    const [techPerformance, setTechPerformance] = useState<TechnicianPerformance[]>([]);
    const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
    const [equipmentAnalytics, setEquipmentAnalytics] = useState<EquipmentAnalytics | null>(null);

    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const loadAnalyticsData = useCallback(async () => {
        try {
            setLoading(true);

            const [woTrends, revTrends, techPerf, topCust, equipAnalytics] = await Promise.all([
                apiService.getWorkOrderTrends(),
                apiService.getRevenueTrends(),
                apiService.getTechnicianPerformance(),
                apiService.getTopCustomers(),
                apiService.getEquipmentAnalytics()
            ]);

            if (woTrends.success && woTrends.data) {
                setWorkOrderTrends(woTrends.data);
            }
            if (revTrends.success && revTrends.data) {
                setRevenueTrends(revTrends.data);
            }
            if (techPerf.success && techPerf.data) {
                setTechPerformance(techPerf.data);
            }
            if (topCust.success && topCust.data) {
                setTopCustomers(topCust.data);
            }
            if (equipAnalytics.success && equipAnalytics.data) {
                setEquipmentAnalytics(equipAnalytics.data);
            }

            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error loading analytics data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAnalyticsData();
    }, [loadAnalyticsData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Calculate KPIs from trends
    const currentMonthRevenue = revenueTrends.length > 0 ? revenueTrends[revenueTrends.length - 1].revenue : 0;
    const currentMonthJobs = revenueTrends.length > 0 ? revenueTrends[revenueTrends.length - 1].jobCount : 0;
    const totalWorkOrdersLast12Weeks = workOrderTrends.reduce((sum, w) => sum + w.total, 0);
    const avgCompletionRate = workOrderTrends.length > 0
        ? Math.round((workOrderTrends.reduce((sum, w) => sum + w.completed, 0) / totalWorkOrdersLast12Weeks) * 100) || 0
        : 0;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-sm text-gray-600">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                </div>
                <button
                    onClick={loadAnalyticsData}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i>
                    <span>Refresh</span>
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Revenue This Month</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(currentMonthRevenue)}</p>
                            <p className="text-sm text-gray-500 mt-1">{currentMonthJobs} completed jobs</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <i className="ri-money-dollar-circle-line text-xl text-green-600"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Work Orders (12 weeks)</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{totalWorkOrdersLast12Weeks}</p>
                            <p className="text-sm text-gray-500 mt-1">{avgCompletionRate}% completion rate</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i className="ri-file-list-3-line text-xl text-blue-600"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Equipment</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{equipmentAnalytics?.totalEquipment || 0}</p>
                            <p className="text-sm text-orange-600 mt-1">
                                {equipmentAnalytics?.needingMaintenance || 0} need maintenance
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <i className="ri-tools-line text-xl text-purple-600"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Technicians</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{techPerformance.length}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Top: {techPerformance[0]?.completedJobs || 0} jobs
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <i className="ri-user-settings-line text-xl text-indigo-600"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Work Order Trends */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Order Trends</h3>
                    <div className="h-80">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : workOrderTrends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={workOrderTrends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="completed"
                                        name="Completed"
                                        stackId="1"
                                        stroke="#10B981"
                                        fill="#10B981"
                                        fillOpacity={0.6}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="inProgress"
                                        name="In Progress"
                                        stackId="1"
                                        stroke="#3B82F6"
                                        fill="#3B82F6"
                                        fillOpacity={0.6}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="pending"
                                        name="Pending"
                                        stackId="1"
                                        stroke="#F59E0B"
                                        fill="#F59E0B"
                                        fillOpacity={0.6}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <i className="ri-bar-chart-line text-4xl text-gray-400 mb-2"></i>
                                    <p>No work order data available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Revenue Trends */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
                    <div className="h-80">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : revenueTrends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueTrends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                        }}
                                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Revenue"
                                        stroke="#10B981"
                                        fill="url(#revenueGradient)"
                                        strokeWidth={2}
                                    />
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <i className="ri-line-chart-line text-4xl text-gray-400 mb-2"></i>
                                    <p>No revenue data available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Technician Performance */}
                <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Technician Performance</h3>
                    <div className="h-80">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : techPerformance.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={techPerformance} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fontSize: 11 }}
                                        width={100}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                        }}
                                        formatter={(value: number, name: string) => {
                                            if (name === 'Revenue') return [formatCurrency(value), name];
                                            return [value, name];
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="completedJobs" name="Completed Jobs" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <i className="ri-user-line text-4xl text-gray-400 mb-2"></i>
                                    <p>No technician data available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Equipment Condition */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Condition</h3>
                    <div className="h-80">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : equipmentAnalytics && equipmentAnalytics.conditionBreakdown.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={equipmentAnalytics.conditionBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        dataKey="count"
                                        nameKey="condition"
                                        label={({ condition, count }) => `${condition}: ${count}`}
                                        labelLine={false}
                                    >
                                        {equipmentAnalytics.conditionBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <i className="ri-pie-chart-line text-4xl text-gray-400 mb-2"></i>
                                    <p>No equipment data available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Customers Table */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : topCustomers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Rank</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Company</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Work Orders</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Completed</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Total Revenue</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Last Service</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topCustomers.map((customer, index) => (
                                    <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                    index === 1 ? 'bg-gray-200 text-gray-700' :
                                                        index === 2 ? 'bg-orange-100 text-orange-800' :
                                                            'bg-gray-100 text-gray-600'
                                                }`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{customer.name}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{customer.companyName || '-'}</td>
                                        <td className="py-3 px-4 text-sm text-center text-gray-900">{customer.totalWorkOrders}</td>
                                        <td className="py-3 px-4 text-sm text-center text-green-600">{customer.completedWorkOrders}</td>
                                        <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                                            {formatCurrency(customer.totalRevenue)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-gray-600">
                                            {formatDate(customer.lastServiceDate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <i className="ri-user-star-line text-4xl text-gray-400 mb-2"></i>
                        <p>No customer data available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;
