import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import api from './services/api';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Technicians from './pages/Technicians';
import Customers from './pages/Customers';
import Equipment from './pages/Equipment';
import Inventory from './pages/Inventory';
import InventoryOrders from './pages/InventoryOrders';
import Settings from './pages/Settings';
import WorkOrders from './pages/WorkOrders';
import WorkshopQueue from './pages/WorkshopQueue';
import WorkshopMetrics from './pages/WorkshopMetrics';
import SetupWizard from './pages/Setup/SetupWizard';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  const { checkAuth, isAuthenticated } = useAuthStore();
  const [setupNeeded, setSetupNeeded] = useState<boolean | null>(null);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  useEffect(() => {
    // Check if setup is needed
    const checkSetup = async () => {
      try {
        const response = await api.get<{
          setupNeeded: boolean;
          userCount: number;
          companyCount: number;
        }>('/setup/check');
        setSetupNeeded(response.data?.setupNeeded ?? false);
      } catch (error) {
        console.error('Error checking setup status:', error);
        setSetupNeeded(false); // Assume setup is not needed if check fails
      } finally {
        setIsCheckingSetup(false);
      }
    };

    checkSetup();
    checkAuth();
  }, [checkAuth]);

  // Show loading while checking setup status
  if (isCheckingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-primary animate-spin"></i>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If setup is needed, redirect to setup wizard
  if (setupNeeded) {
    return (
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/setup" element={<SetupWizard />} />
              <Route path="*" element={<Navigate to="/setup" replace />} />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Setup Route - Block access if setup is complete */}
            <Route
              path="/setup"
              element={<Navigate to="/login" replace />}
            />

            {/* Public Routes */}
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'admin', 'manager']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="work-orders" element={<WorkOrders />} />
              <Route path="workshop-queue" element={<WorkshopQueue />} />
              <Route path="workshop-metrics" element={<WorkshopMetrics />} />
              
              <Route path="technicians" element={<Technicians />} />

              <Route path="customers" element={<Customers />} />
              
              <Route path="equipment" element={<Equipment />} />

              <Route path="inventory" element={<Inventory />} />
              <Route path="inventory-orders" element={<InventoryOrders />} />

              <Route
                path="analytics"
                element={
                  <div className="p-6">
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                      <i className="ri-bar-chart-line text-6xl text-gray-400 mb-4"></i>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h2>
                      <p className="text-gray-600">Analytics page coming soon...</p>
                    </div>
                  </div>
                } 
              />
              
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
