import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface Device {
    id: string;
    full_name: string;
    email: string;
    role: string;
    fcm_token_preview: string;
    updated_at: string;
}

interface NotificationResult {
    userId: string;
    userName: string;
    success: boolean;
    error?: string;
    messageId?: string;
}

interface FirebaseStatus {
    firebase_initialized: boolean;
    registered_devices: number;
    message: string;
}

interface DevicesListResponse {
    devices: Device[];
}

interface TestNotificationResponse {
    results: NotificationResult[];
}

const NotificationTest: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<FirebaseStatus | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [results, setResults] = useState<NotificationResult[]>([]);
    const [title, setTitle] = useState('🧪 Test Notification');
    const [body, setBody] = useState('This is a test notification from FSM Pro Admin');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const response = await apiService.get<FirebaseStatus>('/devices/status');
            if (response.success && response.data) {
                setStatus(response.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch status');
        } finally {
            setLoading(false);
        }
    };

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const response = await apiService.get<DevicesListResponse>('/devices/list');
            if (response.success && response.data) {
                setDevices(response.data.devices || []);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch devices');
        } finally {
            setLoading(false);
        }
    };

    const sendTestNotification = async (userId?: string) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            setResults([]);

            const response = await apiService.post<TestNotificationResponse>('/devices/test-notification', {
                user_id: userId,
                title,
                body
            });

            if (response.success) {
                setSuccess(response.message || 'Notification sent successfully');
                setResults(response.data?.results || []);
            } else {
                setError(response.error || 'Failed to send notification');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send notification');
            if (err.response?.data?.firebase_initialized === false) {
                setStatus(prev => prev ? { ...prev, firebase_initialized: false } : null);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        fetchDevices();
    }, []);

    const refresh = () => {
        fetchStatus();
        fetchDevices();
        setResults([]);
        setError(null);
        setSuccess(null);
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <i className="ri-notification-3-line text-2xl text-gray-700 mr-3"></i>
                    <h1 className="text-2xl font-bold text-gray-900">Push Notification Test</h1>
                </div>
                <button
                    onClick={refresh}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i>
                    <span>Refresh</span>
                </button>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Firebase Status */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Firebase Status</h3>
                    {status ? (
                        <div className="flex items-center gap-3">
                            {status.firebase_initialized ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    <i className="ri-check-line mr-1"></i>
                                    Initialized
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                    <i className="ri-error-warning-line mr-1"></i>
                                    Not Initialized
                                </span>
                            )}
                            <span className="text-sm text-gray-500">{status.message}</span>
                        </div>
                    ) : (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    )}
                </div>

                {/* Registered Devices */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Registered Devices</h3>
                    <div className="flex items-center gap-3">
                        <i className="ri-smartphone-line text-2xl text-primary"></i>
                        <span className="text-3xl font-bold text-gray-900">
                            {status?.registered_devices ?? '...'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                        <i className="ri-error-warning-line text-red-600 mr-2"></i>
                        <span className="text-red-800">{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                        <i className="ri-close-line"></i>
                    </button>
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                        <i className="ri-check-line text-green-600 mr-2"></i>
                        <span className="text-green-800">{success}</span>
                    </div>
                    <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
                        <i className="ri-close-line"></i>
                    </button>
                </div>
            )}

            {/* Firebase Not Initialized Warning */}
            {status && !status.firebase_initialized && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                        <i className="ri-alert-line text-yellow-600 mr-2 mt-0.5"></i>
                        <div>
                            <strong className="text-yellow-800">Firebase is not initialized!</strong>
                            <p className="text-yellow-700 text-sm mt-1">Make sure:</p>
                            <ul className="list-disc list-inside text-yellow-700 text-sm mt-1">
                                <li>firebase-service-account.json exists in the api/ folder</li>
                                <li>The API server was restarted after adding the file</li>
                                <li>The service account JSON is valid (from Firebase Console → Project Settings → Service Accounts)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Notification Form */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Test Notification</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notification Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notification Body</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <button
                        onClick={() => sendTestNotification()}
                        disabled={loading || !status?.firebase_initialized}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <i className="ri-send-plane-line"></i>
                        )}
                        <span>Send to All Devices ({devices.length})</span>
                    </button>
                </div>
            </div>

            {/* Results */}
            {results.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Results</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error/Message ID</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {results.map((result) => (
                                    <tr key={result.userId}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.userName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {result.success ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Sent
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {result.error || result.messageId || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Registered Devices Table */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Registered Devices</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token Preview</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {devices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No devices registered yet
                                    </td>
                                </tr>
                            ) : (
                                devices.map((device) => (
                                    <tr key={device.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{device.full_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {device.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                {device.fcm_token_preview}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => sendTestNotification(device.id)}
                                                disabled={loading || !status?.firebase_initialized}
                                                className="text-primary hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Send test to this device"
                                            >
                                                <i className="ri-send-plane-line text-lg"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default NotificationTest;
